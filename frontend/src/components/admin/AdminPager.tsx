import { ArrowLeft, ArrowRight } from "lucide-react";

export function AdminPager({
  hasPrevious,
  hasNext,
  busy,
  onPrevious,
  onNext,
}: {
  hasPrevious: boolean;
  hasNext: boolean;
  busy: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!hasPrevious && !hasNext) return null;
  return (
    <nav className="admin-pager" aria-label="Pagination des résultats">
      <button className="button button-secondary button-small" type="button" disabled={!hasPrevious || busy} onClick={onPrevious}>
        <ArrowLeft aria-hidden="true" /> Précédent
      </button>
      <span aria-live="polite">{busy ? "Chargement…" : "Page chargée"}</span>
      <button className="button button-secondary button-small" type="button" disabled={!hasNext || busy} onClick={onNext}>
        Suivant <ArrowRight aria-hidden="true" />
      </button>
    </nav>
  );
}
