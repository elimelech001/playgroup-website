import { useState } from 'react';
import { useStore } from './store';
import { DataFilePrompt } from './components/shared/DataFilePrompt';
import { ChildrenTab } from './components/children/ChildrenTab';
import { PaymentsTab } from './components/payments/PaymentsTab';
import { NewslettersTab } from './components/files/NewslettersTab';
import { CalendarTab } from './components/calendar/CalendarTab';
import { SchoolYearSwitcher } from './components/shared/SchoolYearSwitcher';
import { clearHandle, getLastFileName } from './lib/persistence';
import type { TabId } from './types';

const TAB_LABELS: Record<TabId, string> = {
  children: 'Child Profiles',
  payments: 'Payment Tracker',
  newsletters: 'Newsletters',
  calendar: 'Calendar',
};

const TABS: TabId[] = ['children', 'payments', 'newsletters', 'calendar'];

function App() {
  const [fileReady, setFileReady] = useState(false);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const saveError = useStore((s) => s.saveError);
  const setSaveError = useStore((s) => s.setSaveError);

  if (!fileReady) {
    return <DataFilePrompt onReady={() => setFileReady(true)} />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Save error banner */}
      {saveError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between">
          <p className="text-rose-700 text-sm">Save failed: {saveError}</p>
          <button
            onClick={() => setSaveError(null)}
            className="text-rose-400 hover:text-rose-600 ml-4 text-lg leading-none"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation bar — fixed 48px */}
      <nav className="h-12 bg-stone-100 border-b border-stone-200 flex items-center px-4 gap-1 sticky top-0 z-40">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-3 h-8 rounded-md text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-700'
                : 'text-stone-600 hover:text-stone-800 hover:bg-stone-200',
            ].join(' ')}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <SchoolYearSwitcher />
          <button
            onClick={() => { clearHandle(); setFileReady(false); }}
            title={getLastFileName() ?? 'Change data file'}
            className="text-xs text-stone-400 hover:text-teal-700 underline underline-offset-2 shrink-0"
          >
            Change file
          </button>
        </div>
      </nav>

      {/* Tab content */}
      <main className="p-4">
        {activeTab === 'children' && <ChildrenTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'newsletters' && <NewslettersTab />}
        {activeTab === 'calendar' && <CalendarTab />}
      </main>
    </div>
  );
}

export default App;
