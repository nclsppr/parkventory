import { CarFront } from "lucide-react";
import { useI18n } from "../i18n/I18n";
import { landingMessages } from "../i18n/landing";

const parkingStates = [
  "occupied",
  "available",
  "occupied",
  "empty",
  "occupied",
  "selected",
  "occupied",
  "available",
  "occupied",
  "empty",
  "occupied",
  "available",
  "empty",
  "occupied",
  "occupied",
  "available",
  "empty",
  "occupied",
  "selected",
  "occupied",
  "available",
  "occupied",
  "empty",
  "occupied",
];

interface ParkingGridProps {
  compact?: boolean;
}

export function ParkingGrid({ compact = false }: ParkingGridProps) {
  const { locale } = useI18n();

  return (
    <div
      className={`parking-grid ${compact ? "parking-grid-compact" : ""}`}
      role="img"
      aria-label={landingMessages[locale].parkingGridLabel}
    >
      {parkingStates.map((state, index) => (
        <span className={`parking-bay parking-bay-${state}`} key={`${state}-${index}`}>
          {state === "occupied" && <CarFront aria-hidden="true" />}
          {state === "selected" && <CarFront aria-hidden="true" />}
        </span>
      ))}
    </div>
  );
}
