import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useActiveYear, useStore, useLeftChildren } from '@/store';
import { ChildCardGrid } from './ChildCardGrid';
import { ChildCard } from './ChildCard';
import { ChildProfileView } from './ChildProfileView';
import { ReenrollmentSelector } from './ReenrollmentSelector';
import type { Child } from '@/types';

export function ChildrenTab() {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedChildReadOnly, setSelectedChildReadOnly] = useState(false);
  const [reenrollDismissed, setReenrollDismissed] = useState(false);
  const [leftExpanded, setLeftExpanded] = useState(false);

  const activeYear = useActiveYear();
  const allYears = useStore((s) => s.schoolYears);
  const allChildren = useStore((s) => s.children);
  const viewedYearId = useStore((s) => s.viewedYearId);
  const reenrollChildren = useStore((s) => s.reenrollChildren);
  const leftChildren = useLeftChildren();

  if (!activeYear) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-stone-500">No active school year. Create one using the school year switcher.</p>
      </div>
    );
  }

  if (selectedChild) {
    return (
      <ChildProfileView
        child={selectedChild}
        onBack={() => { setSelectedChild(null); setSelectedChildReadOnly(false); }}
        readOnly={selectedChildReadOnly}
      />
    );
  }

  const isViewingPastYear = viewedYearId !== null && viewedYearId !== activeYear.id;

  if (isViewingPastYear) {
    const archivedChildren = allChildren.filter((c) => c.schoolYearId === viewedYearId);
    const viewedYear = allYears.find((y) => y.id === viewedYearId);
    return (
      <div className="space-y-4">
        <p className="text-stone-500 text-sm">
          Viewing archived children from {viewedYear?.name ?? 'previous year'}.
        </p>
        {archivedChildren.length === 0 ? (
          <p className="text-stone-500 py-8 text-center">No children in this school year.</p>
        ) : (
          <div role="list" className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {archivedChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onSelect={(c) => { setSelectedChild(c); setSelectedChildReadOnly(true); }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const prevYear = allYears
    .filter((y) => !y.isActive)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;

  const currentYearChildNames = new Set(
    allChildren.filter((c) => c.schoolYearId === activeYear.id).map((c) => c.name)
  );

  const available = prevYear
    ? allChildren.filter(
        (c) => c.schoolYearId === prevYear.id && !currentYearChildNames.has(c.name)
      )
    : [];

  const showReenrollment = !reenrollDismissed && prevYear !== null && available.length > 0;

  function handleReenroll(selectedIds: string[]) {
    if (selectedIds.length > 0) {
      reenrollChildren(selectedIds, activeYear!.id);
    }
    setReenrollDismissed(true);
  }

  return (
    <div>
      {showReenrollment && (
        <ReenrollmentSelector
          children={available}
          prevYearName={prevYear!.name}
          newSchoolYearId={activeYear.id}
          onDone={handleReenroll}
        />
      )}
      <ChildCardGrid onSelectChild={(c) => setSelectedChild(c)} />

      {leftChildren.length > 0 && (
        <div className="mt-6 border-t border-stone-200 pt-4">
          <button
            type="button"
            onClick={() => setLeftExpanded((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-800"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${leftExpanded ? 'rotate-90' : ''}`}
              aria-hidden="true"
            />
            Left this year ({leftChildren.length})
          </button>
          {leftExpanded && (
            <div
              role="list"
              className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mt-3"
            >
              {leftChildren.map((child) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  onSelect={(c) => setSelectedChild(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
