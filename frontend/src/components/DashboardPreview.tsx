import { CalendarDays, CarFront, ChevronRight, LayoutGrid } from "lucide-react";
import { LogoMark } from "./Logo";
import { ParkingGrid } from "./ParkingGrid";

export function DashboardPreview() {
  return (
    <div className="dashboard-preview" aria-label="Aperçu de démonstration de l’application Parkventory">
      <div className="preview-rail" aria-hidden="true">
        <LogoMark className="preview-logo" />
        <span className="preview-nav-active">
          <LayoutGrid />
        </span>
        <span><CalendarDays /></span>
        <span><CarFront /></span>
      </div>
      <div className="preview-content">
        <div className="preview-heading">
          <div>
            <p>Bonjour, Nicolas</p>
            <span>Voici les disponibilités du jour.</span>
          </div>
          <span className="preview-site">Aperçu démo</span>
        </div>
        <div className="preview-stats">
          <div>
            <span className="preview-stat-icon"><CarFront /></span>
            <strong>12</strong>
            <small>places disponibles</small>
          </div>
          <div>
            <span className="preview-stat-icon preview-stat-icon-cyan"><CalendarDays /></span>
            <strong>B-18</strong>
            <small>réservée à 14:00</small>
            <ChevronRight className="preview-chevron" />
          </div>
        </div>
        <div className="preview-map">
          <div className="preview-map-heading">
            <span>Disponibilités cette semaine</span>
            <div className="preview-legend">
              <span><i className="dot dot-green" /> Disponible</span>
              <span><i className="dot dot-cyan" /> Sélectionnée</span>
            </div>
          </div>
          <ParkingGrid compact />
        </div>
      </div>
    </div>
  );
}
