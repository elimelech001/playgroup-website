import { useStore } from '@/store';
import { PaymentCell } from './PaymentCell';
import type { Child, HebrewMonth } from '@/types';

interface PaymentRowProps {
  child: Child;
  months: HebrewMonth[];
  schoolYearId: string;
  openCellKey: string | null;
  onCellOpenChange: (key: string, open: boolean) => void;
  rowIndex: number;
  allChildIds: string[];
}

export function PaymentRow({
  child,
  months,
  schoolYearId,
  openCellKey,
  onCellOpenChange,
  rowIndex,
  allChildIds,
}: PaymentRowProps) {
  const getPaymentForCell = useStore((s) => s.getPaymentForCell);
  const allPayments = useStore((s) => s.payments);
  const payments = allPayments.filter(
    (p) => p.childId === child.id && p.schoolYearId === schoolYearId
  );

  const rowTotal = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  function handleArrowKey(monthIndex: number, direction: 'left' | 'right' | 'up' | 'down') {
    if (direction === 'left' || direction === 'right') {
      const nextIdx = direction === 'right' ? monthIndex + 1 : monthIndex - 1;
      if (nextIdx >= 0 && nextIdx < months.length) {
        const m = months[nextIdx];
        const key = `${child.id}-${m.hebrewYear}-${m.month}`;
        document.getElementById(key)?.focus();
      }
    } else {
      const nextRowIdx = direction === 'down' ? rowIndex + 1 : rowIndex - 1;
      if (nextRowIdx >= 0 && nextRowIdx < allChildIds.length) {
        const m = months[monthIndex];
        const key = `${allChildIds[nextRowIdx]}-${m.hebrewYear}-${m.month}`;
        document.getElementById(key)?.focus();
      }
    }
  }

  return (
    <tr className="h-9 hover:bg-stone-50 group">
      <td
        className="sticky left-0 z-10 bg-white border-r border-b border-stone-200 px-3 py-1.5 w-40 text-sm font-medium text-stone-800 group-hover:bg-stone-50"
        role="rowheader"
        scope="row"
      >
        <span className="block truncate max-w-[148px]" title={child.name}>
          {child.name}
        </span>
      </td>
      {months.map((month, monthIndex) => {
        const cellKey = `${child.id}-${month.hebrewYear}-${month.month}`;
        const isAfterLeft = child.leftDate
          ? month.roshChodeshDate > child.leftDate
          : false;
        if (isAfterLeft) {
          return (
            <td
              key={cellKey}
              className="border bg-stone-100 border-stone-100 px-2 py-1.5 w-20 h-9 text-center text-xs"
              role="gridcell"
              aria-label={`${child.name}, ${month.name}: not applicable`}
            />
          );
        }
        const payment = getPaymentForCell(child.id, month.month, month.hebrewYear) ?? null;
        return (
          <PaymentCell
            key={cellKey}
            cellKey={cellKey}
            payment={payment}
            child={child}
            month={month}
            schoolYearId={schoolYearId}
            isOpen={openCellKey === cellKey}
            onOpenChange={(open) => onCellOpenChange(cellKey, open)}
            onClick={() => onCellOpenChange(cellKey, true)}
            onArrowKey={(dir) => handleArrowKey(monthIndex, dir)}
          />
        );
      })}
      <td
        className="sticky right-0 z-10 bg-white border-l border-b border-stone-200 px-2 py-1.5 w-24 text-right text-xs tabular-nums group-hover:bg-stone-50 font-semibold text-stone-700"
        role="gridcell"
      >
        {rowTotal > 0 ? `₪${rowTotal.toLocaleString()}` : '—'}
      </td>
    </tr>
  );
}
