interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-md animate-slide-up"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 shadow-elevated">
        <p className="flex-1 text-sm font-medium text-text-primary">{message}</p>
        <button
          type="button"
          className="shrink-0 text-xs font-semibold text-text-muted"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
