import { useState, useRef, useId } from 'react';
import { X } from 'lucide-react';

/**
 * TagInput — chip-based multi-value input.
 * Add: Enter or comma. Remove: click × or Backspace on empty input.
 */
const TagInput = ({
  label,
  value = [],
  onChange,
  placeholder = 'Type and press Enter…',
  maxItems = 15,
  maxLength = 40,
  suggestions = [],
  error,
  helperText,
  className = '',
}) => {
  const [inputVal, setInputVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const id = useId();

  const addTag = (raw) => {
    const tag = raw.trim().replace(/\s+/g, ' ');
    if (!tag || tag.length > maxLength) return;
    if (value.length >= maxItems) return;
    // case-insensitive dedup
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setInputVal('');
    setShowSuggestions(false);
  };

  const removeTag = (idx) => onChange(value.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const filtered = suggestions.filter(
    (s) =>
      inputVal &&
      s.toLowerCase().includes(inputVal.toLowerCase()) &&
      !value.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          className="text-sm font-medium text-[var(--color-foreground)]"
          onClick={() => inputRef.current?.focus()}
        >
          {label}
          {maxItems && (
            <span className="ml-1 text-xs text-[var(--color-muted-foreground)] font-normal">
              ({value.length}/{maxItems})
            </span>
          )}
        </label>
      )}

      {/* Tag container — click anywhere focuses input */}
      <div
        role="group"
        aria-label={label}
        onClick={() => inputRef.current?.focus()}
        className={[
          'min-h-[42px] w-full rounded-lg px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text',
          'bg-[var(--color-surface)] border transition-colors duration-150',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]',
        ].join(' ')}
      >
        {value.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
              aria-label={`Remove ${tag}`}
              className="rounded-full hover:bg-[var(--color-accent)]/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={value.length < maxItems ? placeholder : ''}
          disabled={value.length >= maxItems}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none disabled:cursor-not-allowed"
          aria-autocomplete={suggestions.length ? 'list' : 'none'}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden z-10">
          {filtered.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>}
      {!error && helperText && <p className="text-xs text-[var(--color-muted-foreground)]">{helperText}</p>}
    </div>
  );
};

export default TagInput;
