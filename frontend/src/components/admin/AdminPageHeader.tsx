import type { ReactNode } from "react";
import { AppLink } from "../AppLink";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </header>
  );
}

export function AdminMetricBand({
  items,
  label,
}: {
  items: Array<{ label: string; value: string; detail?: string; href?: string }>;
  label: string;
}) {
  return (
    <dl className="admin-metric-band" aria-label={label}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.href ? <AppLink href={item.href}>{item.value}</AppLink> : item.value}</dd>
          {item.detail && <small>{item.detail}</small>}
        </div>
      ))}
    </dl>
  );
}
