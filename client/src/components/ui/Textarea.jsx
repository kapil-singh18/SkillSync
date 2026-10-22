import React from 'react';

const Textarea = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      id,
      rows = 4,
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            {label}
            {required && (
              <span className="ml-1 text-[var(--color-danger)]" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          required={required}
          className={[
            'w-full rounded-lg px-3 py-2.5 text-sm resize-y',
            'bg-[var(--color-surface)] text-[var(--color-foreground)]',
            'border transition-colors duration-150 outline-none',
            'placeholder:text-[var(--color-muted-foreground)]',
            'focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-0',
            error
              ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} role="alert" className="text-xs text-[var(--color-danger)]">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="text-xs text-[var(--color-muted-foreground)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
