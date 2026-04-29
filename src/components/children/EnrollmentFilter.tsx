import type { EnrollmentStatus } from '@/types';

interface FilterOption {
  value: EnrollmentStatus | 'all';
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all',              label: 'All' },
  { value: 'none',             label: 'No contract' },
  { value: 'contractReceived', label: 'Contract received' },
  { value: 'contractSigned',   label: 'Contract signed' },
  { value: 'left',             label: 'Left' },
];

interface EnrollmentFilterProps {
  selected: EnrollmentStatus[];
  onChange: (statuses: EnrollmentStatus[]) => void;
}

export function EnrollmentFilter({ selected, onChange }: EnrollmentFilterProps) {
  const isAllActive = selected.length === 0;

  function handleClick(value: FilterOption['value']) {
    if (value === 'all') {
      onChange([]);
      return;
    }
    const isCurrentlySelected = selected.includes(value);
    if (isCurrentlySelected) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function getPillClass(value: FilterOption['value']) {
    const isActive =
      value === 'all'
        ? isAllActive
        : selected.includes(value as EnrollmentStatus);
    if (isActive) {
      return 'bg-teal-700 text-white rounded-full px-3 py-1 text-sm font-medium transition-colors';
    }
    return 'bg-stone-100 text-stone-600 rounded-full px-3 py-1 text-sm font-medium hover:bg-stone-200 transition-colors';
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter by enrollment status"
    >
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={getPillClass(opt.value)}
          onClick={() => handleClick(opt.value)}
          aria-pressed={
            opt.value === 'all'
              ? isAllActive
              : selected.includes(opt.value as EnrollmentStatus)
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
