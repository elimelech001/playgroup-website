import { useState } from 'react';
import { useActiveYear, useActiveEnrolledChildren } from '@/store';
import * as hebrewCalendar from '@/lib/hebrewCalendar';
import { PaymentRow } from './PaymentRow';
import { PaymentTotalsRow } from './PaymentTotalsRow';

export function PaymentGrid() {
  const activeYear = useActiveYear();
  const children = useActiveEnrolledChildren();
  const [openCellKey, setOpenCellKey] = useState<string | null>(null);

  if (!activeYear) {
    return <p className="text-stone-500 text-sm p-4">No active school year configured.</p>;
  }

  const months = hebrewCalendar.getHebrewMonthsForYear(activeYear);
  const sortedChildren = [...children].sort((a, b) => a.name.localeCompare(b.name, 'he'));

  if (sortedChildren.length === 0) {
    return (
      <p className="text-stone-500 text-sm p-4">No children enrolled in this school year.</p>
    );
  }

  function handleCellOpenChange(key: string, open: boolean) {
    setOpenCellKey(open ? key : null);
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="border-collapse min-w-full"
        role="grid"
        aria-label="Payment tracker grid"
      >
        <thead className="sticky top-0 z-20 bg-stone-100">
          <tr>
            <th
              className="sticky left-0 z-30 bg-stone-100 border-r border-b border-stone-200 px-3 py-1.5 w-40 text-left text-sm font-semibold text-stone-700"
              role="columnheader"
              scope="col"
            >
              Child
            </th>
            {months.map((m) => (
              <th
                key={`${m.hebrewYear}-${m.month}`}
                className="border-b border-stone-200 px-2 py-1.5 w-20 text-center text-sm font-semibold text-stone-700 bg-stone-100"
                role="columnheader"
                scope="col"
              >
                {m.name}
              </th>
            ))}
            <th
              className="sticky right-0 z-30 bg-stone-100 border-l border-b border-stone-200 px-2 py-1.5 w-24 text-center text-sm font-semibold text-stone-700"
              role="columnheader"
              scope="col"
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedChildren.map((child, rowIndex) => (
            <PaymentRow
              key={child.id}
              child={child}
              months={months}
              schoolYearId={activeYear.id}
              openCellKey={openCellKey}
              onCellOpenChange={handleCellOpenChange}
              rowIndex={rowIndex}
              allChildIds={sortedChildren.map((c) => c.id)}
            />
          ))}
        </tbody>
        <tfoot>
          <PaymentTotalsRow months={months} schoolYearId={activeYear.id} />
        </tfoot>
      </table>
    </div>
  );
}
