import type { AdminOverviewData } from "../../types";
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
  const maximum = Math.max(1, ...series.flatMap((item) => [
    item.newTenants,
    item.newUsers,
    item.shares,
    item.reservations,
    item.incidents,
  ]));
  const description = series.length
    ? `${series.length} jours. Maximum observé : ${formatNumber(maximum)} événement${maximum === 1 ? "" : "s"} par jour.`
    : "Aucune mesure disponible sur la période.";

  return (
    <figure className="admin-trend" aria-labelledby="admin-trend-title">
      <figcaption>
        <div>
          <h2 id="admin-trend-title">Évolution du réseau</h2>
          <p>Acquisition, usage et incidents · 30 jours</p>
        </div>
        <ul className="admin-trend-legend" aria-label="Séries affichées">
          <li><i className="admin-key-new-tenant" aria-hidden="true" /> Nouveaux tenants</li>
          <li><i className="admin-key-new-user" aria-hidden="true" /> Nouveaux utilisateurs</li>
          <li><i className="admin-key-share" aria-hidden="true" /> Partages</li>
          <li><i className="admin-key-reservation" aria-hidden="true" /> Réservations</li>
          <li><i className="admin-key-incident" aria-hidden="true" /> Incidents</li>
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
      ) : <div className="admin-trend-no-data">Aucune donnée</div>}
      {series.length > 0 && (
        <div className="admin-trend-axis" aria-hidden="true">
          <span>{formatSeriesDate(series[0].date)}</span>
          <span>{formatSeriesDate(series[series.length - 1].date)}</span>
        </div>
      )}
      <table className="sr-only">
        <caption>Données quotidiennes du graphique</caption>
        <thead><tr><th>Date</th><th>Nouveaux tenants</th><th>Nouveaux utilisateurs</th><th>Partages</th><th>Réservations</th><th>Incidents</th></tr></thead>
        <tbody>{series.map((item) => (
          <tr key={item.date}>
            <th>{formatSeriesDate(item.date)}</th>
            <td>{item.newTenants}</td><td>{item.newUsers}</td><td>{item.shares}</td><td>{item.reservations}</td><td>{item.incidents}</td>
          </tr>
        ))}</tbody>
      </table>
    </figure>
  );
}
