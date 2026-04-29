import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { AppState, SchoolYear } from '../types';
import * as persistence from '../lib/persistence';
import { createSchoolYearsSlice, type SchoolYearsSlice } from './schoolYearsSlice';
import { createChildrenSlice, type ChildrenSlice } from './childrenSlice';
import { createPaymentsSlice, type PaymentsSlice } from './paymentsSlice';
import { createCalendarSlice, type CalendarSlice } from './calendarSlice';
import { createUISlice, type UISlice } from './uiSlice';

export type RootState = SchoolYearsSlice & ChildrenSlice & PaymentsSlice & CalendarSlice & UISlice;

// ============================================================
// WRITE-THROUGH MIDDLEWARE
// Wraps set() so that every persistent slice mutation triggers saveData().
// UI slice actions (setActiveTab, setSearchTerm, etc.) must NOT be wrapped —
// they are excluded by the slice implementations themselves (they don't call save).
// ============================================================

const PERSISTENT_ACTIONS = new Set([
  'addChild', 'updateChild', 'markChildLeft', 'reenrollChildren',
  'addSchoolYear', 'setActiveYear', 'deleteSchoolYear', 'editSchoolYear',
  'upsertPayment', 'revertPayment',
  'setCalendar',
]);

function withWriteThrough(
  set: (partial: Partial<RootState> | ((state: RootState) => Partial<RootState>)) => void,
  get: () => RootState,
  actionName?: string
) {
  return (partial: Partial<RootState> | ((state: RootState) => Partial<RootState>)) => {
    set(partial);
    if (actionName && PERSISTENT_ACTIONS.has(actionName) && persistence.isFileOpen()) {
      const state = get();
      const appState: AppState = {
        version: 1,
        schoolYears: state.schoolYears,
        children: state.children,
        payments: state.payments,
        calendar: state.calendar,
      };
      persistence.saveData(appState).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Save failed';
        set({ saveError: msg } as Partial<RootState>);
      });
    }
  };
}

export const useStore = create<RootState>((set, get) => {
  const makeSet = (actionName: string) =>
    withWriteThrough(set as Parameters<typeof withWriteThrough>[0], get, actionName);

  const schoolYears = createSchoolYearsSlice(
    makeSet('addSchoolYear') as Parameters<typeof createSchoolYearsSlice>[0],
    get as Parameters<typeof createSchoolYearsSlice>[1]
  );
  // Wrap individual mutating actions with their own write-through tags
  schoolYears.deleteSchoolYear = (id) => {
    makeSet('deleteSchoolYear')((state) => ({
      schoolYears: state.schoolYears.filter((y: SchoolYear) => y.id !== id),
      viewedYearId: state.viewedYearId === id ? null : state.viewedYearId,
    }));
  };
  schoolYears.editSchoolYear = (id, patch) => {
    makeSet('editSchoolYear')((state) => ({
      schoolYears: state.schoolYears.map((y: SchoolYear) =>
        y.id === id ? { ...y, ...patch } : y
      ),
    }));
  };
  const children = createChildrenSlice(
    makeSet('addChild') as Parameters<typeof createChildrenSlice>[0],
    get as Parameters<typeof createChildrenSlice>[1],
    makeSet('reenrollChildren') as Parameters<typeof createChildrenSlice>[2]
  );
  const payments = createPaymentsSlice(
    makeSet('upsertPayment') as Parameters<typeof createPaymentsSlice>[0],
    get as Parameters<typeof createPaymentsSlice>[1]
  );
  // revertPayment also needs write-through since it mutates persisted payments
  payments.revertPayment = (childId, month, hebrewYear) => {
    makeSet('revertPayment')((state) => {
      const key = `${childId}|${month}|${hebrewYear}`;
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
    });
  };
  const calendar = createCalendarSlice(
    makeSet('setCalendar') as Parameters<typeof createCalendarSlice>[0],
    get as Parameters<typeof createCalendarSlice>[1]
  );
  const ui = createUISlice(
    set as Parameters<typeof createUISlice>[0],
    get as Parameters<typeof createUISlice>[1]
  );

  return { ...schoolYears, ...children, ...payments, ...calendar, ...ui };
});

// ============================================================
// HYDRATE — load AppState from persistence into the store
// ============================================================
export function hydrateStore(state: AppState) {
  useStore.setState({
    schoolYears: state.schoolYears,
    children: state.children,
    payments: state.payments,
    calendar: state.calendar,
  });
}

// ============================================================
// SELECTORS
// ============================================================

export function useActiveYear() {
  return useStore((s) => s.schoolYears.find((y) => y.isActive) ?? null);
}

export function useViewedYear() {
  return useStore((s) => {
    const viewedId = s.viewedYearId;
    if (viewedId) return s.schoolYears.find((y) => y.id === viewedId) ?? null;
    return s.schoolYears.find((y) => y.isActive) ?? null;
  });
}

export function useActiveChildren() {
  return useStore(
    useShallow((s) => {
      const activeYear = s.schoolYears.find((y) => y.isActive);
      if (!activeYear) return [];
      return s.children.filter(
        (c) => c.schoolYearId === activeYear.id && c.enrollmentStatus !== 'left'
      );
    })
  );
}

export function useLeftChildren() {
  return useStore(
    useShallow((s) => {
      const activeYear = s.schoolYears.find((y) => y.isActive);
      if (!activeYear) return [];
      return s.children.filter(
        (c) => c.schoolYearId === activeYear.id && c.enrollmentStatus === 'left'
      );
    })
  );
}

export function useChildById(id: string | null) {
  return useStore((s) => (id ? s.children.find((c) => c.id === id) ?? null : null));
}

export function usePaymentsForChild(childId: string, schoolYearId: string) {
  return useStore(
    useShallow((s) =>
      s.payments.filter((p) => p.childId === childId && p.schoolYearId === schoolYearId)
    )
  );
}

export function useActiveEnrolledChildren() {
  return useStore(
    useShallow((s) => {
      const activeYear = s.schoolYears.find((y) => y.isActive);
      if (!activeYear) return [];
      return s.children.filter(
        (c) => c.schoolYearId === activeYear.id && c.enrollmentStatus !== 'left'
      );
    })
  );
}
