import type { TabId, DialogId, EnrollmentStatus } from '../types';
import type { StoreApi } from 'zustand';

export interface UISlice {
  activeTab: TabId;
  openDialog: DialogId;
  searchTerm: string;
  selectedChildId: string | null;
  saveError: string | null;
  enrollmentFilters: EnrollmentStatus[];
  viewedYearId: string | null;
  hasFolderHandle: boolean;
  setActiveTab: (tab: TabId) => void;
  setOpenDialog: (dialog: DialogId) => void;
  setSearchTerm: (term: string) => void;
  setSelectedChildId: (id: string | null) => void;
  setSaveError: (error: string | null) => void;
  setEnrollmentFilters: (filters: EnrollmentStatus[]) => void;
  setViewedYearId: (id: string | null) => void;
  setHasFolderHandle: (value: boolean) => void;
}

export function createUISlice(
  set: StoreApi<UISlice>['setState'],
  _get: StoreApi<UISlice>['getState']
): UISlice {
  const storedTab = localStorage.getItem('gan:activeTab') as TabId | null;

  return {
    activeTab: storedTab ?? 'children',
    openDialog: null,
    searchTerm: '',
    selectedChildId: null,
    saveError: null,
    enrollmentFilters: [],
    viewedYearId: null,
    hasFolderHandle: false,
    setActiveTab: (tab) => {
      localStorage.setItem('gan:activeTab', tab);
      set({ activeTab: tab });
    },
    setOpenDialog: (dialog) => set({ openDialog: dialog }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedChildId: (id) => set({ selectedChildId: id }),
    setSaveError: (error) => set({ saveError: error }),
    setEnrollmentFilters: (filters) => set({ enrollmentFilters: filters }),
    setViewedYearId: (id) => set({ viewedYearId: id }),
    setHasFolderHandle: (value) => set({ hasFolderHandle: value }),
  };
}
