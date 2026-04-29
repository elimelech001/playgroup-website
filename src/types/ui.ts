import type { EnrollmentStatus } from './data';

export type TabId = 'children' | 'payments' | 'newsletters' | 'calendar';

export type DialogId =
  | 'addChild'
  | 'editChild'
  | 'newSchoolYear'
  | 'withdrawChild'
  | null;

export interface FilterState {
  searchTerm: string;
  enrollmentFilters: EnrollmentStatus[];
}
