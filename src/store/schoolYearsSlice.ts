import type { SchoolYear } from '../types';
import type { StoreApi } from 'zustand';

export interface SchoolYearsSlice {
  schoolYears: SchoolYear[];
  addSchoolYear: (year: SchoolYear) => void;
  setActiveYear: (id: string) => void;
  deleteSchoolYear: (id: string) => void;
  editSchoolYear: (id: string, patch: Partial<Pick<SchoolYear, 'name' | 'startDate' | 'endDate' | 'defaultPaymentAmount'>>) => void;
  setViewedYearId: (id: string | null) => void;
  viewedYearId: string | null;
}

export function createSchoolYearsSlice(
  set: StoreApi<SchoolYearsSlice>['setState'],
  _get: StoreApi<SchoolYearsSlice>['getState']
): SchoolYearsSlice {
  return {
    schoolYears: [],
    viewedYearId: null,
    addSchoolYear: (year) =>
      set((state) => ({
        schoolYears: [...state.schoolYears, year],
      })),
    setActiveYear: (id) =>
      set((state) => ({
        schoolYears: state.schoolYears.map((y) => ({
          ...y,
          isActive: y.id === id,
        })),
      })),
    deleteSchoolYear: (id) =>
      set((state) => ({
        schoolYears: state.schoolYears.filter((y) => y.id !== id),
        viewedYearId: state.viewedYearId === id ? null : state.viewedYearId,
      })),
    editSchoolYear: (id, patch) =>
      set((state) => ({
        schoolYears: state.schoolYears.map((y) =>
          y.id === id ? { ...y, ...patch } : y
        ),
      })),
    setViewedYearId: (id) => set({ viewedYearId: id }),
  };
}
