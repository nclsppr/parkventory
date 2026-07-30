import { AlertTriangle, Check, X } from "lucide-react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  tone?: "success" | "error";
}

export function Toast({ message, onDismiss, tone = "success" }: ToastProps) {
  if (!message) return null;

  return (
    <div
      className={`toast ${tone === "error" ? "toast-error" : ""}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <span className="toast-icon">
        {tone === "error" ? <AlertTriangle aria-hidden="true" /> : <Check aria-hidden="true" />}
      </span>
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Fermer la notification">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
