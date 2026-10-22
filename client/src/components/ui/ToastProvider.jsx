import { useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20',
  error: 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border-[var(--color-danger)]/20',
  info: 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20',
};

const ToastItem = ({ toast }) => {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = iconMap[toast.type] || Info;

  const dismiss = useCallback(() => removeToast(toast.id), [removeToast, toast.id]);

  useEffect(() => {
    const timer = setTimeout(dismiss, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [dismiss, toast.duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start gap-3 w-full max-w-sm rounded-xl p-4',
        'border shadow-lg bg-[var(--color-surface)]',
        'animate-[slideInRight_200ms_ease]',
        colorMap[toast.type] || colorMap.info,
      ].join(' ')}
    >
      <Icon size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium text-[var(--color-foreground)]">
        {toast.message}
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const ToastProvider = () => {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ToastProvider;
