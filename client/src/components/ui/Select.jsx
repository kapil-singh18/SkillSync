import React from 'react';

const Select = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      id,
      options = [],
      placeholder = 'Select an option',
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
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
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          required={required}
          className={[
            'h-10 w-full rounded-lg px-3 text-sm appearance-none cursor-pointer',
            'bg-[var(--color-surface)] text-[var(--color-foreground)]',
            'border transition-colors duration-150 outline-none',
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
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value ?? opt}
              value={opt.value ?? opt}
              disabled={opt.disabled}
            >
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} role="alert" className="text-xs text-[var(--color-danger)]">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="text-xs text-[var(--color-muted-foreground)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
