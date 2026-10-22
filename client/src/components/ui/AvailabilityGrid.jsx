const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['morning', 'afternoon', 'evening', 'night'];
const SLOT_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };
const SLOT_TIMES = { morning: '6–12', afternoon: '12–17', evening: '17–21', night: '21–24' };

/**
 * AvailabilityGrid — 7 days × 4 time slots toggle grid.
 * Each cell is an accessible button with aria-pressed.
 * Horizontally scrollable on small screens.
 */
const AvailabilityGrid = ({ label = 'Availability', value = [], onChange, error }) => {
  const isActive = (day, slot) =>
    value.some((a) => a.day === day && a.slot === slot);

  const toggle = (day, slot) => {
    if (isActive(day, slot)) {
      onChange(value.filter((a) => !(a.day === day && a.slot === slot)));
    } else {
      onChange([...value, { day, slot }]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-[var(--color-foreground)]">
          {label}
          <span className="ml-1 text-xs text-[var(--color-muted-foreground)] font-normal">
            ({value.length} slots selected)
          </span>
        </span>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full border-collapse text-xs" role="grid" aria-label="Weekly availability">
          <thead>
            <tr>
              <th className="p-2 w-24 text-left text-[var(--color-muted-foreground)] font-medium bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                Slot
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className="p-2 text-center font-semibold text-[var(--color-foreground)] bg-[var(--color-surface)] border-b border-[var(--color-border)] min-w-[52px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, si) => (
              <tr key={slot} className={si % 2 === 0 ? 'bg-[var(--color-background)]' : 'bg-[var(--color-surface)]'}>
                <td className="p-2 border-r border-[var(--color-border)]">
                  <div className="font-medium text-[var(--color-foreground)]">{SLOT_LABELS[slot]}</div>
                  <div className="text-[var(--color-muted-foreground)] text-[10px]">{SLOT_TIMES[slot]}</div>
                </td>
                {DAYS.map((day) => {
                  const active = isActive(day, slot);
                  return (
                    <td key={day} className="p-1.5 text-center">
                      <button
                        type="button"
                        role="gridcell"
                        aria-pressed={active}
                        aria-label={`${day} ${SLOT_LABELS[slot]}`}
                        onClick={() => toggle(day, slot)}
                        className={[
                          'w-9 h-9 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
                          'focus-visible:ring-offset-[var(--color-background)]',
                          active
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-[var(--color-border)]/40 text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]',
                        ].join(' ')}
                      >
                        {active ? '✓' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
};

export default AvailabilityGrid;
