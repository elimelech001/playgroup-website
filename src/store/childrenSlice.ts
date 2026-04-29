import type { Child } from '../types';
import type { StoreApi } from 'zustand';

export interface ChildrenSlice {
  children: Child[];
  addChild: (child: Child) => void;
  updateChild: (child: Child) => void;
  markChildLeft: (childId: string, leftDate: string) => void;
  reenrollChildren: (childIds: string[], newSchoolYearId: string) => void;
}

export function createChildrenSlice(
  set: StoreApi<ChildrenSlice>['setState'],
  _get: StoreApi<ChildrenSlice>['getState'],
  setReenroll: StoreApi<ChildrenSlice>['setState']
): ChildrenSlice {
  return {
    children: [],
    addChild: (child) =>
      set((state) => ({ children: [...state.children, child] })),
    updateChild: (child) =>
      set((state) => ({
        children: state.children.map((c) => (c.id === child.id ? child : c)),
      })),
    markChildLeft: (childId, leftDate) =>
      set((state) => ({
        children: state.children.map((c) =>
          c.id === childId
            ? { ...c, enrollmentStatus: 'left' as const, leftDate }
            : c
        ),
      })),
    reenrollChildren: (childIds, newSchoolYearId) =>
      setReenroll((state) => {
        const toEnroll = state.children.filter((c) => childIds.includes(c.id));
        const newChildren = toEnroll.map((c) => ({
          ...c,
          id: crypto.randomUUID(),
          schoolYearId: newSchoolYearId,
          enrollmentStatus: 'none' as const,
          leftDate: undefined,
        }));
        return { children: [...state.children, ...newChildren] };
      }),
  };
}
