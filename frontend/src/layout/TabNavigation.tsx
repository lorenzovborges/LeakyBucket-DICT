export type TabId = 'pix' | 'dict' | 'monitor';

const TABS: { id: TabId; label: string }[] = [
  { id: 'pix', label: 'Pix Transaction' },
  { id: 'dict', label: 'DICT Simulator' },
  { id: 'monitor', label: 'Bucket Monitor' },
];

interface TabNavigationProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNavigation({ active, onChange }: TabNavigationProps) {
  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
