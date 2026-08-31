import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";

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
  const { locale } = useI18n();
  const copy = adminMessages[locale].pager;
  if (!hasPrevious && !hasNext) return null;
  return (
    <nav className="admin-pager" aria-label={copy.label}>
      <button className="button button-secondary button-small" type="button" disabled={!hasPrevious || busy} onClick={onPrevious}>
        <ArrowLeft aria-hidden="true" /> {copy.previous}
      </button>
      <span aria-live="polite">{busy ? copy.loading : copy.loaded}</span>
      <button className="button button-secondary button-small" type="button" disabled={!hasNext || busy} onClick={onNext}>
        {copy.next} <ArrowRight aria-hidden="true" />
      </button>
    </nav>
  );
}
