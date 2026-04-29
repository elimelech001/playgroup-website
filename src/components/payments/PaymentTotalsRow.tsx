import { useStore } from '@/store';
import type { HebrewMonth } from '@/types';

interface PaymentTotalsRowProps {
  months: HebrewMonth[];
  schoolYearId: string;
}

export function PaymentTotalsRow({ months, schoolYearId }: PaymentTotalsRowProps) {
  const allPayments = useStore((s) => s.payments);
  const payments = allPayments.filter((p) => p.schoolYearId === schoolYearId);

  function monthTotal(month: HebrewMonth): number {
    return payments
      .filter((p) => p.hebrewMonth === month.month && p.hebrewYear === month.hebrewYear && p.status !== 'empty')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  }

  const grandTotal = months.reduce((sum, m) => sum + monthTotal(m), 0);

  return (
    <tr className="sticky bottom-0 bg-stone-100 border-t-2 border-stone-300 font-medium">
      <td
        className="sticky left-0 z-10 bg-stone-100 border-r border-stone-200 px-3 py-1.5 w-40 text-sm font-semibold text-stone-700"
        role="rowheader"
        scope="row"
      >
        Totals
      </td>
      {months.map((m) => {
        const total = monthTotal(m);
        return (
          <td
            key={`${m.hebrewYear}-${m.month}`}
            className="border border-stone-200 px-2 py-1.5 w-20 text-center text-xs tabular-nums text-stone-700 font-semibold"
            role="gridcell"
          >
            {total > 0 ? `₪${total.toLocaleString()}` : '—'}
          </td>
        );
      })}
      <td
        className="sticky right-0 z-10 bg-stone-100 border-l border-stone-200 px-2 py-1.5 w-24 text-right text-xs tabular-nums text-stone-700 font-semibold"
        role="gridcell"
      >
        {grandTotal > 0 ? `₪${grandTotal.toLocaleString()}` : '—'}
      </td>
    </tr>
  );
}
