import { useState } from 'react';

const Tabs = ({
  tabs = [],
  defaultTab,
  onChange,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleChange = (id) => {
    setActiveTab(id);
    onChange?.(id);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-[var(--color-border)] overflow-x-auto"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => handleChange(tab.id)}
            disabled={tab.disabled}
            className={[
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap',
              'border-b-2 -mb-px transition-colors duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
              'focus-visible:ring-offset-[var(--color-background)] rounded-t-sm',
              activeTab === tab.id
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            {tab.label}
            {tab.badge != null && (
              <span className="ml-1 rounded-full bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="pt-4 outline-none"
        tabIndex={0}
      >
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;
