import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Child, EnrollmentStatus } from '@/types';

interface ReenrollmentSelectorProps {
  children: Child[];
  prevYearName: string;
  newSchoolYearId: string;
  onDone: (selectedIds: string[]) => void;
}

const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  none: 'No contract',
  contractReceived: 'Contract received',
  contractSigned: 'Contract signed',
  left: 'Left',
};

export function ReenrollmentSelector({
  children,
  prevYearName,
  onDone,
}: ReenrollmentSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(children.map((c) => c.id))
  );

  function toggleChild(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(children.map((c) => c.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function handleEnroll() {
    onDone([...selected]);
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-amber-900 text-sm">
          Returning children from {prevYearName}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-amber-700 hover:text-amber-900 underline"
          >
            Select All
          </button>
          <span className="text-amber-300">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-xs text-amber-700 hover:text-amber-900 underline"
          >
            Deselect All
          </button>
        </div>
      </div>

      <ul className="max-h-48 overflow-y-auto space-y-1">
        {children.map((child) => (
          <li key={child.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`reenroll-${child.id}`}
              checked={selected.has(child.id)}
              onChange={() => toggleChild(child.id)}
              className="accent-teal-700"
            />
            <label
              htmlFor={`reenroll-${child.id}`}
              className="text-sm text-stone-800 cursor-pointer flex-1"
            >
              {child.name}
              <span className="ml-2 text-xs text-stone-500">
                ({ENROLLMENT_LABELS[child.enrollmentStatus]})
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          className="text-stone-600 hover:text-stone-800 text-sm"
          onClick={() => onDone([])}
        >
          Skip
        </Button>
        <Button
          type="button"
          className="bg-teal-700 text-white hover:bg-teal-800 text-sm"
          onClick={handleEnroll}
          disabled={selected.size === 0}
        >
          Enroll Selected ({selected.size})
        </Button>
      </div>
    </div>
  );
}
