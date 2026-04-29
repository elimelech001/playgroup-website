import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Child, HebrewMonth, PaymentRecord, PaymentStatus } from '@/types';

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  paid:     'bg-emerald-100 text-emerald-800 border-emerald-300',
  partial:  'bg-amber-100   text-amber-800   border-amber-300',
  unpaid:   'bg-rose-100    text-rose-800    border-rose-300',
  overpaid: 'bg-blue-100    text-blue-800    border-blue-300',
  empty:    'bg-stone-50    text-stone-400   border-stone-200',
};

const EDITOR_STATUS_OPTIONS: {
  value: Exclude<PaymentStatus, 'empty'>;
  label: string;
  active: string;
  inactive: string;
}[] = [
  {
    value: 'paid',
    label: 'Paid',
    active: 'bg-emerald-600 text-white border-emerald-600',
    inactive: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
  },
  {
    value: 'partial',
    label: 'Partial',
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'border-amber-300 text-amber-700 hover:bg-amber-50',
  },
  {
    value: 'unpaid',
    label: 'Unpaid',
    active: 'bg-rose-600 text-white border-rose-600',
    inactive: 'border-rose-300 text-rose-700 hover:bg-rose-50',
  },
  {
    value: 'overpaid',
    label: 'Overpaid',
    active: 'bg-blue-600 text-white border-blue-600',
    inactive: 'border-blue-300 text-blue-700 hover:bg-blue-50',
  },
];

interface PaymentCellProps {
  payment: PaymentRecord | null;
  child: Child;
  month: HebrewMonth;
  schoolYearId: string;
  cellKey: string;
  onClick: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onArrowKey?: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

export function PaymentCell({
  payment,
  child,
  month,
  schoolYearId,
  cellKey,
  isOpen,
  onOpenChange,
  onArrowKey,
}: PaymentCellProps) {
  const upsertPayment = useStore((s) => s.upsertPayment);
  const revertPayment = useStore((s) => s.revertPayment);
  const canRevert = useStore((s) => s.canRevertPayment(child.id, month.month, month.hebrewYear));
  const defaultPaymentAmount = useStore(
    (s) => s.schoolYears.find((y) => y.id === schoolYearId)?.defaultPaymentAmount
  );

  const [editorStatus, setEditorStatus] = useState<PaymentStatus>(payment?.status ?? 'unpaid');
  const [editorAmount, setEditorAmount] = useState<string>(
    payment?.amount != null ? String(payment.amount) : ''
  );
  const [editorNote, setEditorNote] = useState<string>(payment?.note ?? '');

  useEffect(() => {
    if (isOpen) {
      setEditorStatus(payment?.status ?? 'unpaid');
      // Pre-fill with default amount when no amount has been set yet
      setEditorAmount(
        payment?.amount != null
          ? String(payment.amount)
          : defaultPaymentAmount != null
          ? String(defaultPaymentAmount)
          : ''
      );
      setEditorNote(payment?.note ?? '');
    }
  }, [isOpen, payment, defaultPaymentAmount]);

  function commit() {
    const isEmpty = editorStatus === 'empty';
    const parsedAmount = editorAmount.trim() !== '' ? Number(editorAmount) : undefined;
    const record: PaymentRecord = {
      id: payment?.id ?? crypto.randomUUID(),
      childId: child.id,
      schoolYearId,
      hebrewMonth: month.month,
      hebrewYear: month.hebrewYear,
      status: editorStatus,
      amount: isEmpty ? undefined : (parsedAmount != null && !isNaN(parsedAmount) ? parsedAmount : undefined),
      note: isEmpty ? undefined : (editorNote.trim() || undefined),
      carryForward: payment?.carryForward,
    };
    upsertPayment(record);
  }

  function handleOpenChange(open: boolean) {
    if (!open) commit();
    onOpenChange(open);
  }

  const displayStatus: PaymentStatus = payment?.status ?? 'empty';
  const statusClasses = STATUS_CLASSES[displayStatus];
  const amountLabel = payment?.amount != null ? `, ₪${payment.amount}` : '';
  const ariaLabel = `${child.name}, ${month.name}: ${displayStatus}${amountLabel}`;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <td
          id={cellKey}
          className={cn(
            'relative border px-2 py-1.5 w-20 h-9 text-center text-xs tabular-nums',
            'cursor-pointer hover:brightness-95 transition-[filter] duration-100',
            statusClasses
          )}
          role="gridcell"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenChange(true);
              return;
            }
            if (e.key === 'ArrowRight') { e.preventDefault(); onArrowKey?.('right'); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); onArrowKey?.('left'); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); onArrowKey?.('down'); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); onArrowKey?.('up'); }
          }}
        >
          {payment?.amount != null && (
            <span className="text-xs tabular-nums">₪{payment.amount}</span>
          )}
          {payment?.note ? (
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-stone-400"
              aria-hidden="true"
            />
          ) : null}
        </td>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-3 space-y-3"
      >
        <p className="text-xs font-semibold text-stone-600 truncate">
          {child.name} · {month.name}
        </p>

        {payment?.carryForward != null && payment.carryForward > 0 && (
          <p className="text-stone-500 text-xs">
            Carry-forward from previous month: ₪{payment.carryForward.toLocaleString()}
          </p>
        )}

        {/* Status strip — click again to deselect back to empty */}
        <div className="flex gap-1">
          {EDITOR_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setEditorStatus((prev) => (prev === opt.value ? 'empty' : opt.value))
              }
              className={cn(
                'flex-1 rounded border text-xs font-medium py-1 transition-colors',
                editorStatus === opt.value ? opt.active : opt.inactive
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 text-sm shrink-0">₪</span>
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="Amount"
            value={editorAmount}
            onChange={(e) => setEditorAmount(e.target.value)}
            className="h-8 text-sm tabular-nums"
            aria-label="Payment amount in shekels"
          />
        </div>

        {/* Note */}
        <Textarea
          placeholder="Note (optional)"
          value={editorNote}
          onChange={(e) => setEditorNote(e.target.value)}
          rows={2}
          className="text-sm resize-none"
          aria-label="Payment note"
        />

        {/* Undo/Revert last change */}
        {canRevert && (
          <button
            type="button"
            onClick={() => {
              revertPayment(child.id, month.month, month.hebrewYear);
              onOpenChange(false);
            }}
            className="text-xs text-stone-400 hover:text-amber-600 underline underline-offset-2 self-start"
          >
            Revert to previous
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
