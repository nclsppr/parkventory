import type { AdminOverviewData } from "../../types";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";
import { formatNumber, formatSeriesDate } from "./adminFormat";

const width = 720;
const height = 220;
const inset = 18;

function points(values: number[], maximum: number) {
  const drawableWidth = width - inset * 2;
  const drawableHeight = height - inset * 2;
  return values.map((value, index) => {
    const x = inset + (values.length === 1 ? 0 : (index / (values.length - 1)) * drawableWidth);
    const y = height - inset - (value / maximum) * drawableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export function AdminTrend({ series }: { series: AdminOverviewData["series"] }) {
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale].trend;
  const maximum = Math.max(1, ...series.flatMap((item) => [
    item.newTenants,
    item.newUsers,
    item.shares,
    item.reservations,
    item.incidents,
  ]));
  const description = series.length
    ? copy.description(series.length, formatNumber(series.length, intlLocale), maximum, formatNumber(maximum, intlLocale))
    : copy.noMeasurements;

  return (
    <figure className="admin-trend" aria-labelledby="admin-trend-title">
      <figcaption>
        <div>
          <h2 id="admin-trend-title">{copy.title}</h2>
          <p>{copy.subtitle}</p>
        </div>
        <ul className="admin-trend-legend" aria-label={copy.legendLabel}>
          <li><i className="admin-key-new-tenant" aria-hidden="true" /> {copy.newOrganizations}</li>
          <li><i className="admin-key-new-user" aria-hidden="true" /> {copy.newUsers}</li>
          <li><i className="admin-key-share" aria-hidden="true" /> {copy.shares}</li>
          <li><i className="admin-key-reservation" aria-hidden="true" /> {copy.bookings}</li>
          <li><i className="admin-key-incident" aria-hidden="true" /> {copy.incidents}</li>
        </ul>
      </figcaption>
      <p className="sr-only" id="admin-trend-description">{description}</p>
      {series.length ? (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="admin-trend-title admin-trend-description">
          <line x1={inset} x2={width - inset} y1={height - inset} y2={height - inset} />
          <line x1={inset} x2={width - inset} y1={inset} y2={inset} />
          <polyline className="admin-trend-new-tenant" points={points(series.map((item) => item.newTenants), maximum)} />
          <polyline className="admin-trend-new-user" points={points(series.map((item) => item.newUsers), maximum)} />
          <polyline className="admin-trend-share" points={points(series.map((item) => item.shares), maximum)} />
          <polyline className="admin-trend-reservation" points={points(series.map((item) => item.reservations), maximum)} />
          <polyline className="admin-trend-incident" points={points(series.map((item) => item.incidents), maximum)} />
        </svg>
      ) : <div className="admin-trend-no-data">{copy.noData}</div>}
      {series.length > 0 && (
        <div className="admin-trend-axis" aria-hidden="true">
          <span>{formatSeriesDate(series[0].date, intlLocale)}</span>
          <span>{formatSeriesDate(series[series.length - 1].date, intlLocale)}</span>
        </div>
      )}
      <table className="sr-only">
        <caption>{copy.tableCaption}</caption>
        <thead><tr><th>{copy.date}</th><th>{copy.newOrganizations}</th><th>{copy.newUsers}</th><th>{copy.shares}</th><th>{copy.bookings}</th><th>{copy.incidents}</th></tr></thead>
        <tbody>{series.map((item) => (
          <tr key={item.date}>
            <th>{formatSeriesDate(item.date, intlLocale)}</th>
            <td>{item.newTenants}</td><td>{item.newUsers}</td><td>{item.shares}</td><td>{item.reservations}</td><td>{item.incidents}</td>
          </tr>
        ))}</tbody>
      </table>
    </figure>
  );
}
