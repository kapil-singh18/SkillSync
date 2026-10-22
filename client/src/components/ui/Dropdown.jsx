import { useEffect, useRef, useState } from 'react';

const Dropdown = ({
  trigger,
  items = [],
  align = 'right',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const alignClass = align === 'left' ? 'left-0' : 'right-0';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        {trigger}
      </div>

      {/* Menu */}
      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={[
            'absolute z-50 mt-1.5 min-w-[160px] rounded-xl overflow-hidden',
            'bg-[var(--color-surface)] border border-[var(--color-border)]',
            'shadow-2xl',
            'animate-[fadeInDown_150ms_ease]',
            alignClass,
          ].join(' ')}
        >
          {items.map((item, i) => {
            if (item.type === 'separator') {
              return (
                <div
                  key={i}
                  role="separator"
                  className="my-1 border-t border-[var(--color-border)]"
                />
              );
            }
            return (
              <button
                key={i}
                role="menuitem"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className={[
                  'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left',
                  'transition-colors duration-100 outline-none',
                  'focus-visible:bg-[var(--color-surface-raised)]',
                  item.danger
                    ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10'
                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {item.icon && (
                  <span className="text-[var(--color-muted-foreground)]">{item.icon}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dropdown;
