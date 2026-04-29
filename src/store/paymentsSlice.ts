import type { PaymentRecord } from '../types';
import type { StoreApi } from 'zustand';

// Maximum undo history entries per cell
const MAX_UNDO_STACK = 20;

export interface PaymentsSlice {
  payments: PaymentRecord[];
  // Undo stack: keyed by "childId|hebrewMonth|hebrewYear", stores previous states
  _paymentUndoStack: Record<string, PaymentRecord[]>;
  upsertPayment: (payment: PaymentRecord) => void;
  revertPayment: (childId: string, month: number, hebrewYear: number) => void;
  getPaymentForCell: (childId: string, month: number, hebrewYear: number) => PaymentRecord | undefined;
  canRevertPayment: (childId: string, month: number, hebrewYear: number) => boolean;
}

function nextHebrewMonth(month: number, hebrewYear: number, isLeap: boolean): { month: number; hebrewYear: number } {
  const monthsInYear = isLeap ? 13 : 12;
  if (month >= monthsInYear) {
    return { month: 1, hebrewYear: hebrewYear + 1 };
  }
  return { month: month + 1, hebrewYear };
}

function isHebrewLeapYear(year: number): boolean {
  return ((7 * year) + 1) % 19 < 7;
}

function cellKey(childId: string, month: number, hebrewYear: number): string {
  return `${childId}|${month}|${hebrewYear}`;
}

export function createPaymentsSlice(
  set: StoreApi<PaymentsSlice>['setState'],
  get: StoreApi<PaymentsSlice>['getState']
): PaymentsSlice {
  return {
    payments: [],
    _paymentUndoStack: {},

    upsertPayment: (payment) =>
      set((state) => {
        const updated = [...state.payments];
        const existingIdx = updated.findIndex((p) => p.id === payment.id);

        // Push current state onto undo stack before overwriting
        const key = cellKey(payment.childId, payment.hebrewMonth, payment.hebrewYear);
        const previousRecord = existingIdx >= 0 ? updated[existingIdx] : undefined;
        const prevStack = state._paymentUndoStack[key] ?? [];
        const newStack = previousRecord
          ? [...prevStack, previousRecord].slice(-MAX_UNDO_STACK)
          : prevStack;

        if (existingIdx >= 0) {
          updated[existingIdx] = payment;
        } else {
          updated.push(payment);
        }

        // Carry-forward: if partial or overpaid, update next month's carryForward
        if (payment.status === 'partial' || payment.status === 'overpaid') {
          const isLeap = isHebrewLeapYear(payment.hebrewYear);
          const next = nextHebrewMonth(payment.hebrewMonth, payment.hebrewYear, isLeap);
          const nextIdx = updated.findIndex(
            (p) =>
              p.childId === payment.childId &&
              p.hebrewMonth === next.month &&
              p.hebrewYear === next.hebrewYear
          );
          const carryAmount = payment.amount ?? 0;
          if (nextIdx >= 0) {
            updated[nextIdx] = { ...updated[nextIdx], carryForward: carryAmount };
          } else {
            updated.push({
              id: crypto.randomUUID(),
              childId: payment.childId,
              schoolYearId: payment.schoolYearId,
              hebrewMonth: next.month,
              hebrewYear: next.hebrewYear,
              status: 'empty',
              carryForward: carryAmount,
            });
          }
        } else {
          // Clear carryForward on next month if this month is no longer partial/overpaid
          const isLeap = isHebrewLeapYear(payment.hebrewYear);
          const next = nextHebrewMonth(payment.hebrewMonth, payment.hebrewYear, isLeap);
          const nextIdx = updated.findIndex(
            (p) =>
              p.childId === payment.childId &&
              p.hebrewMonth === next.month &&
              p.hebrewYear === next.hebrewYear
          );
          if (nextIdx >= 0 && updated[nextIdx].carryForward != null) {
            updated[nextIdx] = { ...updated[nextIdx], carryForward: undefined };
          }
        }

        return {
          payments: updated,
          _paymentUndoStack: { ...state._paymentUndoStack, [key]: newStack },
        };
      }),

    revertPayment: (childId, month, hebrewYear) =>
      set((state) => {
        const key = cellKey(childId, month, hebrewYear);
        const stack = state._paymentUndoStack[key];
        if (!stack || stack.length === 0) return state;

        const previous = stack[stack.length - 1];
        const newStack = stack.slice(0, -1);

        const updated = [...state.payments];
        const idx = updated.findIndex(
          (p) => p.childId === childId && p.hebrewMonth === month && p.hebrewYear === hebrewYear
        );
        if (idx >= 0) {
          updated[idx] = previous;
        } else {
          updated.push(previous);
        }

        return {
          payments: updated,
          _paymentUndoStack: { ...state._paymentUndoStack, [key]: newStack },
        };
      }),

    getPaymentForCell: (childId, month, hebrewYear) =>
      get().payments.find(
        (p) => p.childId === childId && p.hebrewMonth === month && p.hebrewYear === hebrewYear
      ),

    canRevertPayment: (childId, month, hebrewYear) => {
      const key = cellKey(childId, month, hebrewYear);
      const stack = get()._paymentUndoStack[key];
      return !!(stack && stack.length > 0);
    },
  };
}
