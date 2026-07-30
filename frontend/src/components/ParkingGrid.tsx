import { CarFront } from "lucide-react";

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
  return (
    <div
      className={`parking-grid ${compact ? "parking-grid-compact" : ""}`}
      role="img"
      aria-label="Plan illustratif : places vertes disponibles, place bleue sélectionnée et places grises occupées"
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
