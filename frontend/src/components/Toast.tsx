import { Check, X } from "lucide-react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon"><Check aria-hidden="true" /></span>
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Fermer la notification">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
