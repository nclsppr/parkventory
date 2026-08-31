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
import { useI18n } from "../i18n/I18n";
import { tenantAdminMessages, type TenantAdminMessages } from "../i18n/tenantAdmin";
import type { TenantAdminMember, TenantAdminOverviewData } from "../types";
import "./tenant-admin.css";

const colorPattern = /^#[0-9A-F]{6}$/i;

function number(value: number, intlLocale: string): string {
  return new Intl.NumberFormat(intlLocale).format(value);
}

function dateTime(value: number | null, intlLocale: string, never: string): string {
  if (value === null) return never;
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium", timeStyle: "short" })
    .format(new Date(value * 1_000));
}

function seriesDate(value: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function UsageSeries({
  data,
  days,
  intlLocale,
  copy,
}: {
  data: TenantAdminOverviewData["series"];
  days: number;
  intlLocale: string;
  copy: TenantAdminMessages["usage"];
}) {
  const maximum = Math.max(1, ...data.flatMap((item) => [item.shares, item.reservations]));
  const formattedDays = number(days, intlLocale);
  return (
    <div className="tenant-usage-series" role="img" aria-label={copy.chartLabel(days, formattedDays)}>
      {data.map((item) => (
        <span
          className="tenant-usage-day"
          key={item.date}
          title={copy.daySummary(
            seriesDate(item.date, intlLocale),
            item.shares,
            number(item.shares, intlLocale),
            item.reservations,
            number(item.reservations, intlLocale),
          )}
        >
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
  copy,
  onCancel,
  onConfirm,
}: {
  member: TenantAdminMember;
  busy: boolean;
  copy: TenantAdminMessages["erase"];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButton.current?.focus();
    return () => returnFocus.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
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
      <section ref={dialog} className="tenant-dialog" role="alertdialog" aria-modal="true" aria-labelledby="erase-title" aria-describedby="erase-detail" aria-busy={busy}>
        <button ref={closeButton} className="tenant-dialog-close" type="button" onClick={onCancel} disabled={busy} aria-label={copy.close}>
          <X aria-hidden="true" />
        </button>
        <span className="tenant-dialog-icon"><Trash2 aria-hidden="true" /></span>
        <p className="tenant-eyebrow">{copy.eyebrow}</p>
        <h2 id="erase-title">{copy.title(member.displayName)}</h2>
        <p id="erase-detail">{copy.detail}</p>
        <p className="tenant-dialog-note">{copy.note}</p>
        <div className="tenant-dialog-actions">
          <button className="button button-secondary" type="button" onClick={onCancel} disabled={busy}>{copy.cancel}</button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            {busy ? copy.erasing : copy.confirm}
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
  const { locale, intlLocale } = useI18n();
  const copy = tenantAdminMessages[locale];
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
    return errorMessage(error, copy.common.actionFailed);
  }, [copy.common.actionFailed, onSessionExpired]);

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
      await updateTenantAdminBranding({
        enabled: brandingEnabled,
        logoEnabled,
        actionColor,
        availableColor,
      });
      await Promise.all([loadOverview(), onRefreshDashboard()]);
      onNotify(copy.branding.saved);
    } catch (error) {
      onNotify(handleApiError(error), "error");
    } finally {
      setBrandingBusy(false);
    }
  };

  const confirmErase = async () => {
    if (!eraseTarget || eraseBusy) return;
    const erasedMemberName = eraseTarget.displayName;
    setEraseBusy(true);
    try {
      await eraseTenantMemberEmail(eraseTarget.membershipId);
      setEraseTarget(null);
      await Promise.all([loadMembers(), loadOverview()]);
      onNotify(copy.erase.success(erasedMemberName));
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
        <h1 tabIndex={-1}>{overviewError ? copy.state.unavailable : copy.state.opening}</h1>
        <p role={overviewError ? "alert" : "status"}>{overviewError ?? copy.state.loadingWorkspace(organizationName)}</p>
        {overviewError && <button className="button button-secondary" type="button" onClick={() => void loadOverview()}>{copy.common.retry}</button>}
      </section>
    );
  }

  return (
    <div className="tenant-admin-page">
      <header className="tenant-admin-header">
        <div>
          <p className="tenant-eyebrow"><ShieldCheck aria-hidden="true" /> {copy.header.eyebrow}</p>
          <h1 tabIndex={-1}>{overview.tenant.name}</h1>
          <p>{copy.header.scopeDescription(overview.tenant.domain)}</p>
        </div>
        <span className="tenant-scope-badge">{copy.header.scopeBadge}</span>
      </header>

      {overviewError && <div className="tenant-inline-error" role="alert">{overviewError}</div>}

      <section className="tenant-metric-band" aria-label={copy.metrics.regionLabel}>
        {[
          [copy.metrics.users, overview.totals.users],
          [copy.metrics.administrators, overview.totals.administrators],
          [copy.metrics.parkingSpaces, overview.totals.parkingSpots],
          [copy.metrics.shares, overview.totals.shares],
          [copy.metrics.bookings, overview.totals.reservations],
          [copy.metrics.activeSessions, overview.totals.activeSessions],
        ].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{number(Number(value), intlLocale)}</strong></div>)}
      </section>

      <section className="tenant-admin-section tenant-usage" aria-labelledby="usage-title">
        <header>
          <div>
            <p className="tenant-eyebrow"><BarChart3 aria-hidden="true" /> {copy.usage.eyebrow}</p>
            <h2 id="usage-title">{copy.usage.title(overview.period.days, number(overview.period.days, intlLocale))}</h2>
          </div>
          <dl>
            <div><dt>{copy.usage.activeUsers}</dt><dd>{number(overview.period.activeUsers, intlLocale)}</dd></div>
            <div><dt>{copy.usage.shares}</dt><dd>{number(overview.period.shares, intlLocale)}</dd></div>
            <div><dt>{copy.usage.bookings}</dt><dd>{number(overview.period.reservations, intlLocale)}</dd></div>
          </dl>
        </header>
        <UsageSeries data={overview.series} days={overview.period.days} intlLocale={intlLocale} copy={copy.usage} />
        <div className="tenant-usage-legend"><span><i /> {copy.usage.shares}</span><span><i /> {copy.usage.bookings}</span></div>
      </section>

      <section className="tenant-admin-section tenant-branding" aria-labelledby="branding-title">
        <header>
          <div>
            <p className="tenant-eyebrow"><Palette aria-hidden="true" /> {copy.branding.eyebrow}</p>
            <h2 id="branding-title">{copy.branding.title}</h2>
            <p>{copy.branding.introduction}</p>
          </div>
        </header>
        <div className="tenant-branding-layout">
          <form onSubmit={saveBranding}>
            <label className="tenant-switch-row">
              <span><strong>{copy.branding.enable}</strong><small>{copy.branding.enableHelp}</small></span>
              <input type="checkbox" checked={brandingEnabled} onChange={(event) => setBrandingEnabled(event.target.checked)} />
            </label>
            <div className="tenant-color-grid">
              <label>
                <span>{copy.branding.actionColor}</span>
                <div>
                  <input
                    type="color"
                    value={colorsValid ? actionColor : "#C8F913"}
                    onChange={(event) => setActionColor(event.target.value.toUpperCase())}
                    aria-label={`${copy.branding.actionColor} · ${copy.branding.colorPicker}`}
                  />
                  <input
                    type="text"
                    value={actionColor}
                    onChange={(event) => setActionColor(event.target.value.toUpperCase())}
                    maxLength={7}
                    spellCheck={false}
                    aria-label={`${copy.branding.actionColor} · ${copy.branding.hexadecimalValue}`}
                    aria-invalid={!colorPattern.test(actionColor)}
                    aria-describedby={!colorPattern.test(actionColor) ? "tenant-colors-error" : undefined}
                  />
                </div>
              </label>
              <label>
                <span>{copy.branding.availabilityColor}</span>
                <div>
                  <input
                    type="color"
                    value={colorsValid ? availableColor : "#15C9D5"}
                    onChange={(event) => setAvailableColor(event.target.value.toUpperCase())}
                    aria-label={`${copy.branding.availabilityColor} · ${copy.branding.colorPicker}`}
                  />
                  <input
                    type="text"
                    value={availableColor}
                    onChange={(event) => setAvailableColor(event.target.value.toUpperCase())}
                    maxLength={7}
                    spellCheck={false}
                    aria-label={`${copy.branding.availabilityColor} · ${copy.branding.hexadecimalValue}`}
                    aria-invalid={!colorPattern.test(availableColor)}
                    aria-describedby={!colorPattern.test(availableColor) ? "tenant-colors-error" : undefined}
                  />
                </div>
              </label>
            </div>
            {!colorsValid && <p id="tenant-colors-error" className="tenant-field-error" role="alert">{copy.branding.colorFormatError}</p>}
            <label className="tenant-switch-row">
              <span><strong>{copy.branding.useLogo}</strong><small id="tenant-logo-help">{overview.branding.logoAvailable ? copy.branding.logoAuthorized : copy.branding.logoUnavailable}</small></span>
              <input type="checkbox" checked={logoEnabled} onChange={(event) => setLogoEnabled(event.target.checked)} disabled={!overview.branding.logoAvailable} aria-describedby="tenant-logo-help" />
            </label>
            <button className="button button-primary" type="submit" disabled={!colorsValid || brandingBusy}>
              {brandingBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
              {brandingBusy ? copy.branding.saving : copy.branding.save}
            </button>
          </form>
          <div className={`tenant-brand-preview ${brandingEnabled ? "is-enabled" : ""}`} style={previewStyle} role="img" aria-label={copy.branding.previewAria}>
            <span aria-hidden="true">{copy.branding.preview}</span>
            <div className="tenant-brand-preview-logo" aria-hidden="true">
              {logoEnabled && overview.branding.logoUrl
                ? <img src={overview.branding.logoUrl} alt={copy.branding.logoAlt(overview.tenant.name)} />
                : <strong>Parkventory</strong>}
            </div>
            <strong aria-hidden="true">{overview.tenant.name}</strong>
            <p aria-hidden="true">{copy.branding.previewSentence}</p>
            <div aria-hidden="true"><button type="button" tabIndex={-1}>{copy.branding.previewShare}</button><span>{copy.branding.previewAvailable}</span></div>
          </div>
        </div>
      </section>

      <section className="tenant-admin-section tenant-members" aria-labelledby="members-title">
        <header>
          <div>
            <p className="tenant-eyebrow"><Users aria-hidden="true" /> {copy.members.eyebrow}</p>
            <h2 id="members-title">{copy.members.title}</h2>
            <p>{copy.members.introduction}</p>
          </div>
          <form className="tenant-member-search" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="tenant-member-query">{copy.members.searchLabel}</label>
            <Search aria-hidden="true" />
            <input id="tenant-member-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.members.searchPlaceholder} maxLength={100} />
            <button type="submit">{copy.members.search}</button>
          </form>
        </header>
        {membersError && <div className="tenant-inline-error" role="alert">{membersError} <button type="button" onClick={() => void loadMembers()}>{copy.common.retry}</button></div>}
        <div className="tenant-member-table-wrap" role="region" aria-label={copy.members.regionLabel} tabIndex={0} aria-busy={membersLoading}>
          <table className="tenant-member-table">
            <caption>{copy.members.caption(overview.tenant.name)}</caption>
            <thead><tr><th>{copy.members.memberColumn}</th><th>{copy.members.roleColumn}</th><th>{copy.members.sessionsColumn}</th><th>{copy.members.lastActivityColumn}</th><th>{copy.members.privacyColumn}</th></tr></thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membershipId}>
                  <th scope="row"><strong>{member.displayName}{member.isSelf ? copy.members.selfSuffix : ""}</strong><span>{member.email ?? copy.members.erasedEmail}</span></th>
                  <td><span className={`tenant-role tenant-role-${member.role.toLowerCase()}`}>{member.role === "ADMIN" ? copy.members.administratorRole : copy.members.memberRole}</span></td>
                  <td>{number(member.activeSessions, intlLocale)}</td>
                  <td>{dateTime(member.lastActivityAt, intlLocale, copy.common.never)}</td>
                  <td>{member.canEraseEmail ? <button className="tenant-erase-trigger" type="button" onClick={() => setEraseTarget(member)}><Trash2 aria-hidden="true" /> {copy.members.eraseEmail}</button> : <span className="tenant-action-unavailable">{member.emailErasedAt ? copy.members.erased : copy.members.unavailable}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!membersLoading && members.length === 0 && <p className="tenant-empty">{copy.members.empty}</p>}
        {membersLoading && <p className="tenant-loading" role="status"><LoaderCircle className="spin" aria-hidden="true" /> {copy.members.loading}</p>}
        {nextCursor && !membersLoading && <button className="button button-secondary tenant-load-more" type="button" onClick={() => void loadMembers({ cursor: nextCursor, append: true })}>{copy.members.loadMore}</button>}
      </section>

      {eraseTarget && <EraseDialog member={eraseTarget} busy={eraseBusy} copy={copy.erase} onCancel={() => setEraseTarget(null)} onConfirm={() => void confirmErase()} />}
    </div>
  );
}
