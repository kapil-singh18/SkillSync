import { Plus, Trash2 } from 'lucide-react';
import Input from './Input';
import Select from './Select';

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

/**
 * SkillEditor — editable list of {name, level} skill rows.
 * Built on the existing Input and Select components.
 */
const SkillEditor = ({
  label = 'Skills',
  value = [],
  onChange,
  maxItems = 20,
  error,
}) => {
  const addRow = () => {
    if (value.length >= maxItems) return;
    onChange([...value, { name: '', level: 'beginner' }]);
  };

  const updateRow = (idx, field, val) => {
    const updated = value.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    onChange(updated);
  };

  const removeRow = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            {label}
            <span className="ml-1 text-xs text-[var(--color-muted-foreground)] font-normal">
              ({value.length}/{maxItems})
            </span>
          </span>
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-[var(--color-muted-foreground)] italic">
          No skills added yet. Click &quot;Add skill&quot; to get started.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {value.map((skill, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                id={`skill-name-${idx}`}
                placeholder="e.g. React, Python, UI Design"
                value={skill.name}
                onChange={(e) => updateRow(idx, 'name', e.target.value)}
                maxLength={40}
                aria-label={`Skill ${idx + 1} name`}
              />
            </div>
            <div className="w-36 flex-shrink-0">
              <Select
                id={`skill-level-${idx}`}
                placeholder="Level"
                options={LEVEL_OPTIONS}
                value={skill.level}
                onChange={(e) => updateRow(idx, 'level', e.target.value)}
                aria-label={`Skill ${idx + 1} level`}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              aria-label={`Remove skill ${skill.name || idx + 1}`}
              className="mt-0.5 p-2 h-10 flex items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] flex-shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {value.length < maxItems && (
        <button
          type="button"
          onClick={addRow}
          className="self-start flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
        >
          <Plus size={14} />
          Add skill
        </button>
      )}

      {error && <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
};

export default SkillEditor;
