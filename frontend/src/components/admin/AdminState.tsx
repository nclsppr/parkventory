import { AlertTriangle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";
import { commonMessages } from "../../i18n/common";

export function AdminLoading({ label }: { label?: string }) {
  const { locale } = useI18n();
  const resolvedLabel = label ?? adminMessages[locale].common.loadingData;
  return (
    <div className="admin-state admin-state-loading" role="status">
      <LoaderCircle className="spin" aria-hidden="true" />
      <span>{resolvedLabel}</span>
      <span className="admin-loading-line" aria-hidden="true" />
      <span className="admin-loading-line admin-loading-line-short" aria-hidden="true" />
    </div>
  );
}

export function AdminError({
  error,
  onRetry,
  title,
}: {
  error: Error;
  onRetry: () => void;
  title?: string;
}) {
  const { locale } = useI18n();
  const copy = adminMessages[locale].common;
  const commonCopy = commonMessages[locale];
  return (
    <div className="admin-state admin-state-error" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <strong>{title ?? copy.unavailableTitle}</strong>
        <p>{error.message}</p>
      </div>
      <button className="button button-secondary button-small" type="button" onClick={onRetry}>
        <RotateCcw aria-hidden="true" /> {commonCopy.retry}
      </button>
    </div>
  );
}

export function AdminEmpty({
  title,
  children,
  action,
}: {
  title: string;
  children: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-state admin-state-empty" role="status">
      <Inbox aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
      {action}
    </div>
  );
}
