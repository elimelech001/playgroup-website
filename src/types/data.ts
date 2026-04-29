export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overpaid' | 'empty';

export type EnrollmentStatus = 'none' | 'contractReceived' | 'contractSigned' | 'left';

export interface Child {
  /** UUID v4 */
  id: string;
  name: string;
  /** ISO 8601 date string, e.g. "2020-03-15" */
  dateOfBirth: string;
  gender: 'male' | 'female';
  phone: string;
  fatherPhone?: string;
  motherPhone?: string;
  address?: string;
  allergies?: string;
  napSchedule?: string;
  enrollmentStatus: EnrollmentStatus;
  notes?: string;
  /** ISO 8601 date set when enrollmentStatus transitions to 'left' */
  leftDate?: string;
  /** Foreign key to SchoolYear.id */
  schoolYearId: string;
}

export interface PaymentRecord {
  /** UUID v4 */
  id: string;
  childId: string;
  schoolYearId: string;
  /** HMonth enum value: TISHREI=1 ... ELUL=12, ADAR_II=13 */
  hebrewMonth: number;
  hebrewYear: number;
  status: PaymentStatus;
  amount?: number;
  note?: string;
  carryForward?: number;
}

export interface SchoolYear {
  /** UUID v4 */
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  /** Default monthly payment amount in ₪ for this school year */
  defaultPaymentAmount?: number;
}

export interface CalendarConfig {
  schoolYearId: string;
  firstDay: string;
  lastDay: string;
  vacationPeriods: Array<{ start: string; end: string }>;
  specialEvents: Array<{ date: string; label: string }>;
}

export interface AppState {
  version: 1;
  schoolYears: SchoolYear[];
  children: Child[];
  payments: PaymentRecord[];
  calendar: CalendarConfig | null;
}
