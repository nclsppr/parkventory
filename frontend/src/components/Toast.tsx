import { AlertTriangle, Check, X } from "lucide-react";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  tone?: "success" | "error";
}

export function Toast({ message, onDismiss, tone = "success" }: ToastProps) {
  const { locale } = useI18n();
  const copy = commonMessages[locale];

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
      <button type="button" onClick={onDismiss} aria-label={copy.closeNotification}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
