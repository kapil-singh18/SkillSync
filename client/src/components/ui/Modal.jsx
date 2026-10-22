import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({
  open = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) => {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={[
          'relative w-full rounded-xl',
          'bg-[var(--color-surface)] border border-[var(--color-border)]',
          'shadow-2xl outline-none',
          'animate-[fadeInScale_150ms_ease]',
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-start justify-between p-5 border-b border-[var(--color-border)]">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-[var(--color-foreground)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-[var(--color-muted-foreground)]"
                >
                  {description}
                </p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="ml-4 p-1 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border)]">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Modal;
