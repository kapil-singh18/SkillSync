import React from 'react';

const Input = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      id,
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
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
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          required={required}
          className={[
            'h-10 w-full rounded-lg px-3 text-sm',
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
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-[var(--color-danger)]"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-[var(--color-muted-foreground)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
