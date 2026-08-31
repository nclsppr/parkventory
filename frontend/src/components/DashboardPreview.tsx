import { CalendarDays, CarFront, ChevronRight, LayoutGrid } from "lucide-react";
import { useI18n } from "../i18n/I18n";
import { landingMessages } from "../i18n/landing";
import { LogoMark } from "./Logo";
import { ParkingGrid } from "./ParkingGrid";

export function DashboardPreview() {
  const { locale } = useI18n();
  const copy = landingMessages[locale].dashboard;

  return (
    <div className="dashboard-preview" role="img" aria-label={copy.label}>
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
            <p>{copy.greeting}</p>
            <span>{copy.introduction}</span>
          </div>
          <span className="preview-site">{copy.demo}</span>
        </div>
        <div className="preview-stats">
          <div>
            <span className="preview-stat-icon"><CarFront /></span>
            <strong>12</strong>
            <small>{copy.availableSpaces}</small>
          </div>
          <div>
            <span className="preview-stat-icon preview-stat-icon-cyan"><CalendarDays /></span>
            <strong>B-18</strong>
            <small>{copy.bookedAt}</small>
            <ChevronRight className="preview-chevron" />
          </div>
        </div>
        <div className="preview-map">
          <div className="preview-map-heading">
            <span>{copy.weekAvailability}</span>
            <div className="preview-legend">
              <span><i className="dot dot-green" /> {copy.available}</span>
              <span><i className="dot dot-cyan" /> {copy.selected}</span>
            </div>
          </div>
          <ParkingGrid compact />
        </div>
      </div>
    </div>
  );
}
