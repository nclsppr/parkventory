import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  LoaderCircle,
  Palette,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  ApiError,
  eraseTenantMemberEmail,
  loadTenantAdminMembers,
  loadTenantAdminOverview,
  updateTenantAdminBranding,
} from "../api/client";
import type { NoticeTone } from "../components/AppShell";
import type { TenantAdminMember, TenantAdminOverviewData } from "../types";
import "./tenant-admin.css";

const colorPattern = /^#[0-9A-F]{6}$/i;

function number(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function dateTime(value: number | null): string {
  if (value === null) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" })
    .format(new Date(value * 1_000));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Cette action n’a pas abouti.";
}

function UsageSeries({ data }: { data: TenantAdminOverviewData["series"] }) {
  const maximum = Math.max(1, ...data.flatMap((item) => [item.shares, item.reservations]));
  return (
    <div className="tenant-usage-series" role="img" aria-label="Partages et réservations quotidiens des 30 derniers jours">
      {data.map((item) => (
        <span className="tenant-usage-day" key={item.date} title={`${item.date} · ${item.shares} partages · ${item.reservations} réservations`}>
          <i className="tenant-usage-share" style={{ height: `${Math.max(3, (item.shares / maximum) * 100)}%` }} />
          <i className="tenant-usage-reservation" style={{ height: `${Math.max(3, (item.reservations / maximum) * 100)}%` }} />
        </span>
      ))}
    </div>
  );
}

function EraseDialog({
  member,
  busy,
  onCancel,
  onConfirm,
}: {
  member: TenantAdminMember;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="tenant-dialog-backdrop">
      <section ref={dialog} className="tenant-dialog" role="alertdialog" aria-modal="true" aria-labelledby="erase-title" aria-describedby="erase-detail">
        <button ref={closeButton} className="tenant-dialog-close" type="button" onClick={onCancel} disabled={busy} aria-label="Annuler et fermer">
          <X aria-hidden="true" />
        </button>
        <span className="tenant-dialog-icon"><Trash2 aria-hidden="true" /></span>
        <p className="tenant-eyebrow">Confidentialité · action sensible</p>
        <h2 id="erase-title">Effacer l’e-mail de {member.displayName} ?</h2>
        <p id="erase-detail">
          L’adresse sera remplacée par un identifiant irréversible et toutes les sessions du compte seront supprimées.
          Les partages, réservations et autres faits métier resteront conservés sans afficher l’e-mail.
        </p>
        <p className="tenant-dialog-note">
          Une future connexion vérifiée avec la même adresse pourra recréer l’accès au compte.
        </p>
        <div className="tenant-dialog-actions">
          <button className="button button-secondary" type="button" onClick={onCancel} disabled={busy}>Annuler</button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            {busy ? "Effacement…" : "Confirmer l’effacement"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function TenantAdminPage({
  organizationName,
  onNotify,
  onSessionExpired,
  onRefreshDashboard,
}: {
  organizationName: string;
  onNotify: (message: string, tone?: NoticeTone) => void;
  onSessionExpired: () => void;
  onRefreshDashboard: () => Promise<void>;
}) {
  const [overview, setOverview] = useState<TenantAdminOverviewData | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [members, setMembers] = useState<TenantAdminMember[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [brandingEnabled, setBrandingEnabled] = useState(false);
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [actionColor, setActionColor] = useState("#C8F913");
  const [availableColor, setAvailableColor] = useState("#15C9D5");
  const [brandingBusy, setBrandingBusy] = useState(false);
  const [eraseTarget, setEraseTarget] = useState<TenantAdminMember | null>(null);
  const [eraseBusy, setEraseBusy] = useState(false);

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) onSessionExpired();
    return errorMessage(error);
  }, [onSessionExpired]);

  const loadOverview = useCallback(async () => {
    try {
      setOverviewError(null);
      const data = await loadTenantAdminOverview();
      setOverview(data);
      setBrandingEnabled(data.branding.enabled);
      setLogoEnabled(data.branding.logoEnabled);
      setActionColor(data.branding.actionColor);
      setAvailableColor(data.branding.availableColor);
    } catch (error) {
      setOverviewError(handleApiError(error));
    }
  }, [handleApiError]);

  const loadMembers = useCallback(async ({ cursor, append = false }: { cursor?: string; append?: boolean } = {}) => {
    try {
      setMembersLoading(true);
      setMembersError(null);
      const data = await loadTenantAdminMembers({ limit: 25, cursor, q: appliedQuery || undefined });
      setMembers((current) => append ? [...current, ...data.items] : data.items);
      setNextCursor(data.page.nextCursor);
    } catch (error) {
      setMembersError(handleApiError(error));
    } finally {
      setMembersLoading(false);
    }
  }, [appliedQuery, handleApiError]);

  useEffect(() => { void loadOverview(); }, [loadOverview]);
  useEffect(() => { void loadMembers(); }, [loadMembers]);

  useEffect(() => {
    if (!overview) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#dashboard-content h1")?.focus({ preventScroll: true });
    });
  }, [overview]);

  const colorsValid = colorPattern.test(actionColor) && colorPattern.test(availableColor);
  const previewStyle = useMemo(() => ({
    "--tenant-preview-action": colorPattern.test(actionColor) ? actionColor : "#C8F913",
    "--tenant-preview-available": colorPattern.test(availableColor) ? availableColor : "#15C9D5",
  }) as CSSProperties, [actionColor, availableColor]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setAppliedQuery(query.trim());
  };

  const saveBranding = async (event: FormEvent) => {
    event.preventDefault();
    if (!colorsValid || brandingBusy) return;
    setBrandingBusy(true);
    try {
      const response = await updateTenantAdminBranding({
        enabled: brandingEnabled,
        logoEnabled,
        actionColor,
        availableColor,
      });
      await Promise.all([loadOverview(), onRefreshDashboard()]);
      onNotify(response.message);
    } catch (error) {
      onNotify(handleApiError(error), "error");
    } finally {
      setBrandingBusy(false);
    }
  };

  const confirmErase = async () => {
    if (!eraseTarget || eraseBusy) return;
    setEraseBusy(true);
    try {
      const response = await eraseTenantMemberEmail(eraseTarget.membershipId);
      setEraseTarget(null);
      await Promise.all([loadMembers(), loadOverview()]);
      onNotify(response.message);
    } catch (error) {
      onNotify(handleApiError(error), "error");
    } finally {
      setEraseBusy(false);
    }
  };

  if (!overview) {
    return (
      <section className="tenant-admin-state">
        {overviewError ? <AlertTriangle aria-hidden="true" /> : <LoaderCircle className="spin" aria-hidden="true" />}
        <h1 tabIndex={-1}>{overviewError ? "L’administration du tenant est indisponible." : "Ouverture de l’administration…"}</h1>
        <p role={overviewError ? "alert" : "status"}>{overviewError ?? `Chargement de l’espace ${organizationName}.`}</p>
        {overviewError && <button className="button button-secondary" type="button" onClick={() => void loadOverview()}>Réessayer</button>}
      </section>
    );
  }

  return (
    <div className="tenant-admin-page">
      <header className="tenant-admin-header">
        <div>
          <p className="tenant-eyebrow"><ShieldCheck aria-hidden="true" /> Administration limitée au tenant</p>
          <h1 tabIndex={-1}>{overview.tenant.name}</h1>
          <p>{overview.tenant.domain} · vous ne voyez que les données de cette organisation.</p>
        </div>
        <span className="tenant-scope-badge">Périmètre tenant</span>
      </header>

      {overviewError && <div className="tenant-inline-error" role="alert">{overviewError}</div>}

      <section className="tenant-metric-band" aria-label="Indicateurs du tenant">
        {[
          ["Utilisateurs", overview.totals.users],
          ["Administrateurs", overview.totals.administrators],
          ["Places", overview.totals.parkingSpots],
          ["Partages", overview.totals.shares],
          ["Réservations", overview.totals.reservations],
          ["Sessions actives", overview.totals.activeSessions],
        ].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{number(Number(value))}</strong></div>)}
      </section>

      <section className="tenant-admin-section tenant-usage" aria-labelledby="usage-title">
        <header>
          <div><p className="tenant-eyebrow"><BarChart3 aria-hidden="true" /> Usage</p><h2 id="usage-title">Activité des 30 derniers jours</h2></div>
          <dl>
            <div><dt>Utilisateurs actifs</dt><dd>{number(overview.period.activeUsers)}</dd></div>
            <div><dt>Partages</dt><dd>{number(overview.period.shares)}</dd></div>
            <div><dt>Réservations</dt><dd>{number(overview.period.reservations)}</dd></div>
          </dl>
        </header>
        <UsageSeries data={overview.series} />
        <div className="tenant-usage-legend"><span><i /> Partages</span><span><i /> Réservations</span></div>
      </section>

      <section className="tenant-admin-section tenant-branding" aria-labelledby="branding-title">
        <header><div><p className="tenant-eyebrow"><Palette aria-hidden="true" /> Identité visuelle</p><h2 id="branding-title">Couleurs et logo du tenant</h2><p>Les couleurs secondaires accessibles sont calculées automatiquement.</p></div></header>
        <div className="tenant-branding-layout">
          <form onSubmit={saveBranding}>
            <label className="tenant-switch-row">
              <span><strong>Activer la co-marque</strong><small>Appliquer ces couleurs dans l’espace du tenant.</small></span>
              <input type="checkbox" checked={brandingEnabled} onChange={(event) => setBrandingEnabled(event.target.checked)} />
            </label>
            <div className="tenant-color-grid">
              <label><span>Couleur d’action</span><div><input type="color" value={colorsValid ? actionColor : "#C8F913"} onChange={(event) => setActionColor(event.target.value.toUpperCase())} /><input type="text" value={actionColor} onChange={(event) => setActionColor(event.target.value.toUpperCase())} maxLength={7} spellCheck={false} aria-invalid={!colorPattern.test(actionColor)} /></div></label>
              <label><span>Couleur de disponibilité</span><div><input type="color" value={colorsValid ? availableColor : "#15C9D5"} onChange={(event) => setAvailableColor(event.target.value.toUpperCase())} /><input type="text" value={availableColor} onChange={(event) => setAvailableColor(event.target.value.toUpperCase())} maxLength={7} spellCheck={false} aria-invalid={!colorPattern.test(availableColor)} /></div></label>
            </div>
            {!colorsValid && <p className="tenant-field-error" role="alert">Utilisez le format #RRGGBB pour les deux couleurs.</p>}
            <label className="tenant-switch-row">
              <span><strong>Utiliser le logo du tenant</strong><small>{overview.branding.logoAvailable ? "Logo autorisé par Parkventory." : "Aucun logo n’a encore été autorisé."}</small></span>
              <input type="checkbox" checked={logoEnabled} onChange={(event) => setLogoEnabled(event.target.checked)} disabled={!overview.branding.logoAvailable} />
            </label>
            <button className="button button-primary" type="submit" disabled={!colorsValid || brandingBusy}>
              {brandingBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
              {brandingBusy ? "Enregistrement…" : "Enregistrer l’identité"}
            </button>
          </form>
          <div className={`tenant-brand-preview ${brandingEnabled ? "is-enabled" : ""}`} style={previewStyle} aria-label="Aperçu de l’identité visuelle">
            <span>Aperçu</span>
            <div className="tenant-brand-preview-logo">
              {logoEnabled && overview.branding.logoUrl
                ? <img src={overview.branding.logoUrl} alt={`Logo ${overview.tenant.name}`} />
                : <strong>Parkventory</strong>}
            </div>
            <strong>{overview.tenant.name}</strong>
            <p>Une place partagée, disponible aujourd’hui.</p>
            <div><button type="button">Partager</button><span>Disponible</span></div>
          </div>
        </div>
      </section>

      <section className="tenant-admin-section tenant-members" aria-labelledby="members-title">
        <header>
          <div><p className="tenant-eyebrow"><Users aria-hidden="true" /> Membres</p><h2 id="members-title">Comptes du tenant</h2><p>Les rôles administrateur sont attribués uniquement par Parkventory.</p></div>
          <form className="tenant-member-search" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="tenant-member-query">Rechercher un membre</label>
            <Search aria-hidden="true" />
            <input id="tenant-member-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou e-mail" maxLength={100} />
            <button type="submit">Rechercher</button>
          </form>
        </header>
        {membersError && <div className="tenant-inline-error" role="alert">{membersError} <button type="button" onClick={() => void loadMembers()}>Réessayer</button></div>}
        <div className="tenant-member-table-wrap" role="region" aria-label="Membres du tenant" tabIndex={0}>
          <table className="tenant-member-table">
            <caption>Membres de {overview.tenant.name}</caption>
            <thead><tr><th>Membre</th><th>Rôle</th><th>Sessions</th><th>Dernière activité</th><th>Confidentialité</th></tr></thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membershipId}>
                  <th scope="row"><strong>{member.displayName}{member.isSelf ? " (vous)" : ""}</strong><span>{member.email ?? "E-mail effacé"}</span></th>
                  <td><span className={`tenant-role tenant-role-${member.role.toLowerCase()}`}>{member.role === "ADMIN" ? "Administrateur du tenant" : "Membre"}</span></td>
                  <td>{number(member.activeSessions)}</td>
                  <td>{dateTime(member.lastActivityAt)}</td>
                  <td>{member.canEraseEmail ? <button className="tenant-erase-trigger" type="button" onClick={() => setEraseTarget(member)}><Trash2 aria-hidden="true" /> Effacer l’e-mail</button> : <span className="tenant-action-unavailable">{member.emailErasedAt ? "Effacé" : "Non disponible"}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!membersLoading && members.length === 0 && <p className="tenant-empty">Aucun membre ne correspond à cette recherche.</p>}
        {membersLoading && <p className="tenant-loading" role="status"><LoaderCircle className="spin" aria-hidden="true" /> Chargement des membres…</p>}
        {nextCursor && !membersLoading && <button className="button button-secondary tenant-load-more" type="button" onClick={() => void loadMembers({ cursor: nextCursor, append: true })}>Charger les membres suivants</button>}
      </section>

      {eraseTarget && <EraseDialog member={eraseTarget} busy={eraseBusy} onCancel={() => setEraseTarget(null)} onConfirm={() => void confirmErase()} />}
    </div>
  );
}
