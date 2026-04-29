import type { CalendarConfig } from '../types';
import type { StoreApi } from 'zustand';

export interface CalendarSlice {
  calendar: CalendarConfig | null;
  setCalendar: (config: CalendarConfig) => void;
}

export function createCalendarSlice(
  set: StoreApi<CalendarSlice>['setState'],
  _get: StoreApi<CalendarSlice>['getState']
): CalendarSlice {
  return {
    calendar: null,
    setCalendar: (config) => set({ calendar: config }),
  };
}
