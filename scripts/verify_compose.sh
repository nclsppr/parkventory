#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
VERIFY_PROJECT="${PARKVENTORY_VERIFY_PROJECT:-parkventory-verify}"

cleanup() {
  exit_code=$?
  trap - EXIT INT TERM
  if (( exit_code != 0 )); then
    docker compose \
      --project-directory "${PROJECT_ROOT}" \
      --project-name "${VERIFY_PROJECT}" \
      ps -a >&2 || true
    docker compose \
      --project-directory "${PROJECT_ROOT}" \
      --project-name "${VERIFY_PROJECT}" \
      logs --tail=200 --no-color >&2 || true
  fi
  docker compose \
    --project-directory "${PROJECT_ROOT}" \
    --project-name "${VERIFY_PROJECT}" \
    down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

export PARKVENTORY_DB_PORT=0
export PARKVENTORY_API_PORT=0
export PARKVENTORY_WEB_PORT=0
export PARKVENTORY_MAILPIT_SMTP_PORT=0
export PARKVENTORY_MAILPIT_UI_PORT=0

docker compose \
  --project-directory "${PROJECT_ROOT}" \
  --project-name "${VERIFY_PROJECT}" \
  up --build -d --wait --wait-timeout 600

docker compose \
  --project-directory "${PROJECT_ROOT}" \
  --project-name "${VERIFY_PROJECT}" \
  exec -T frontend node -e '
const web = "http://127.0.0.1:5173";
const mailpit = "http://mailpit:8025";

const request = async (path, { cookie, headers, ...init } = {}) => {
  const response = await fetch(`${web}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
  });
  const body = await response.json().catch(async () => ({ detail: await response.text() }));
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${body.detail ?? JSON.stringify(body)}`);
  }
  return { response, body };
};

const waitForLatestMail = async (expectedSubject, expectedRecipient) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await fetch(`${mailpit}/api/v1/message/latest`);
    if (response.ok) {
      const message = await response.json();
      const addressedToRecipient = message.To?.some(
        recipient => recipient.Address === expectedRecipient,
      );
      if (message.Subject === expectedSubject && addressedToRecipient) return message;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Mailpit did not receive: ${expectedSubject}`);
};

const tokenFrom = message => {
  const match = message.Text.match(/token=([A-Za-z0-9_-]+)/);
  if (!match) throw new Error("magic-link token missing from Mailpit message");
  return match[1];
};

const authenticate = async email => {
  await request("/api/v1/auth/requests", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const message = await waitForLatestMail(
    "Votre lien de connexion Parkventory",
    email,
  );
  const verified = await request("/api/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token: tokenFrom(message) }),
  });
  const setCookie = verified.response.headers.get("set-cookie");
  if (!setCookie?.startsWith("parkventory_session=")) {
    throw new Error("session cookie missing");
  }
  return setCookie.split(";", 1)[0];
};

const run = async () => {
  const landing = await fetch(`${web}/`);
  if (!landing.ok || !(await landing.text()).includes("Parkventory")) {
    throw new Error("landing marker missing");
  }
  for (const path of [
    "/app",
    "/app/partager",
    "/app/trouver",
    "/auth/callback",
    "/confidentialite",
    "/mentions-legales",
  ]) {
    const route = await fetch(`${web}${path}`);
    if (!route.ok || !(await route.text()).includes("Parkventory")) {
      throw new Error(`frontend route is not directly reachable: ${path}`);
    }
  }
  const health = await fetch(`${web}/q/health/ready`);
  if (!health.ok || (await health.json()).status !== "UP") {
    throw new Error("backend is not ready");
  }
  const mailHealth = await fetch(`${mailpit}/readyz`);
  if (!mailHealth.ok) throw new Error("Mailpit is not ready");

  const suffix = Date.now().toString(36);
  const domain = `compose-${suffix}.test`;
  const ownerEmail = `owner@${domain}`;
  const colleagueEmail = `colleague@${domain}`;
  const inviteeEmail = `invitee@${domain}`;
  const ownerCookie = await authenticate(ownerEmail);

  await request("/api/v1/spots", {
    method: "POST",
    cookie: ownerCookie,
    body: JSON.stringify({ label: "A-24", level: "Niveau A" }),
  });
  const date = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await request("/api/v1/shares", {
    method: "POST",
    cookie: ownerCookie,
    body: JSON.stringify({ spot: "A-24", date, from: "08:00", to: "18:00" }),
  });
  const ownerDashboard = await request("/api/v1/dashboard", { cookie: ownerCookie });
  if (ownerDashboard.body.demo !== false
      || ownerDashboard.body.user.assignedSpot !== "A-24"
      || ownerDashboard.body.user.assignedSiteTimeZone !== "Europe/Paris"
      || ownerDashboard.body.availability.length !== 1
      || ownerDashboard.body.availability.some((item) => item.timeZone !== "Europe/Paris")) {
    throw new Error("owner dashboard is not backed by PostgreSQL");
  }

  const colleagueCookie = await authenticate(colleagueEmail);
  const colleagueDashboard = await request("/api/v1/dashboard", { cookie: colleagueCookie });
  const offer = colleagueDashboard.body.availability.find(item => item.status === "AVAILABLE");
  if (!offer) throw new Error("persisted offer is not visible to the colleague");
  await request(`/api/v1/availability/${offer.id}/reservations`, {
    method: "POST",
    cookie: colleagueCookie,
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  await waitForLatestMail("Votre place A-24 a été réservée", ownerEmail);

  const persisted = await request("/api/v1/dashboard", { cookie: colleagueCookie });
  const persistedOffer = persisted.body.availability.find(item => item.id === offer.id);
  if (persisted.body.stats.reservations !== 1
      || persistedOffer?.status !== "RESERVED"
      || persistedOffer.viewerRelation !== "RESERVED"
      || !persistedOffer.reservationId
      || persistedOffer.canCancel !== true) {
    throw new Error("reservation was not persisted");
  }

  await request(`/api/v1/reservations/${persistedOffer.reservationId}`, {
    method: "DELETE",
    cookie: colleagueCookie,
  });
  await waitForLatestMail(
    "La réservation de votre place A-24 a été annulée",
    ownerEmail,
  );
  const reopened = await request("/api/v1/dashboard", { cookie: colleagueCookie });
  const reopenedOffer = reopened.body.availability.find(item => item.id === offer.id);
  if (reopened.body.stats.reservations !== 0
      || reopenedOffer?.status !== "AVAILABLE"
      || reopenedOffer.reservationId !== null
      || reopenedOffer.canCancel !== false) {
    throw new Error("cancelled reservation did not reopen the offer");
  }

  await request(`/api/v1/availability/${offer.id}`, {
    method: "DELETE",
    cookie: ownerCookie,
  });
  const withdrawn = await request("/api/v1/dashboard", { cookie: ownerCookie });
  if (withdrawn.body.availability.some(item => item.id === offer.id)) {
    throw new Error("withdrawn offer is still active");
  }

  await request("/api/v1/invitations", {
    method: "POST",
    cookie: ownerCookie,
    body: JSON.stringify({ email: inviteeEmail }),
  });
  await waitForLatestMail("Votre invitation Parkventory", inviteeEmail);
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});'

echo "Parcours Compose vérifié : PostgreSQL, Mailpit, Quarkus, Vite, identité, partage, réservation, annulation, retrait et invitation sont sains."
