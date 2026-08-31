import { AlertTriangle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

export function AdminLoading({ label = "Chargement des données…" }: { label?: string }) {
  return (
    <div className="admin-state admin-state-loading" role="status">
      <LoaderCircle className="spin" aria-hidden="true" />
      <span>{label}</span>
      <span className="admin-loading-line" aria-hidden="true" />
      <span className="admin-loading-line admin-loading-line-short" aria-hidden="true" />
    </div>
  );
}

export function AdminError({
  error,
  onRetry,
  title = "Les données ne répondent pas.",
}: {
  error: Error;
  onRetry: () => void;
  title?: string;
}) {
  return (
    <div className="admin-state admin-state-error" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{error.message}</p>
      </div>
      <button className="button button-secondary button-small" type="button" onClick={onRetry}>
        <RotateCcw aria-hidden="true" /> Réessayer
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
