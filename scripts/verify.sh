#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"

command -v git >/dev/null 2>&1 || {
  echo "git est requis pour vérifier le projet." >&2
  exit 1
}

command -v python3 >/dev/null 2>&1 || {
  echo "Python >= 3.9 est requis pour vérifier le projet." >&2
  exit 1
}

command -v node >/dev/null 2>&1 || {
  echo "Node 24 est requis pour vérifier Parkventory." >&2
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "npm est requis pour vérifier Nimbus." >&2
  exit 1
}

node -e 'const major = Number(process.versions.node.split(".")[0]); process.exit(major === 24 ? 0 : 1)' || {
  echo "Node 24 est requis (version détectée : $(node --version))." >&2
  exit 1
}

python3 -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 9) else 1)' || {
  detected_version="$(python3 -c 'import platform; print(platform.python_version())')"
  echo "Python >= 3.9 est requis (version détectée : ${detected_version})." >&2
  exit 1
}

git_root="$(git -C "${PROJECT_ROOT}" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Le projet doit être un dépôt Git avant vérification." >&2
  exit 1
}
git_root="$(cd -- "${git_root}" && pwd -P)"
if [[ "${git_root}" != "${PROJECT_ROOT}" ]]; then
  echo "Le projet doit être la racine de son dépôt Git : ${PROJECT_ROOT}" >&2
  exit 1
fi

python3 "${SCRIPT_DIR}/documentation_catalog.py" --check
python3 "${SCRIPT_DIR}/check_markdown.py"
npm ci --prefix "${PROJECT_ROOT}/docs-nimbus" --ignore-scripts --no-audit --no-fund
npm run check --prefix "${PROJECT_ROOT}/docs-nimbus"
if [[ -n "$(git -C "${PROJECT_ROOT}" ls-files -- docs-nimbus/src/content/docs)" ]]; then
  echo "La collection Nimbus générée ne doit pas être suivie par Git." >&2
  exit 1
fi
git -C "${PROJECT_ROOT}" diff --check
git -C "${PROJECT_ROOT}" diff --cached --check

echo "Vérification du frontend React"
npm ci --prefix "${PROJECT_ROOT}" --ignore-scripts --no-audit --no-fund
npm audit --prefix "${PROJECT_ROOT}" --audit-level=high
npm run frontend:test --prefix "${PROJECT_ROOT}"
npm run frontend:build --prefix "${PROJECT_ROOT}"

command -v docker >/dev/null 2>&1 || {
  echo "Docker est requis pour les tests PostgreSQL de Quarkus." >&2
  exit 1
}

docker info >/dev/null 2>&1 || {
  echo "Le moteur Docker doit être démarré pour les tests PostgreSQL de Quarkus." >&2
  exit 1
}

echo "Vérification du backend Quarkus et de la migration PostgreSQL"
(
  cd "${PROJECT_ROOT}/backend"
  if command -v mise >/dev/null 2>&1; then
    mise exec -- ./mvnw verify -Dquarkus.analytics.disabled=true
  else
    ./mvnw verify -Dquarkus.analytics.disabled=true
  fi
)

echo "Vérification complète de Parkventory terminée."
