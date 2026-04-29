import {
  HDate,
  HebrewCalendar,
  months,
  type CalOptions,
} from '@hebcal/core';

import type { SchoolYear } from '../types';

// months is a plain object mapping name → number
// e.g. months.TISHREI = 7, months.NISAN = 1
// We alias it as HMonth for clarity within this module
const HMonth = months;
type HMonthValue = number;

export interface HebrewMonth {
  hebrewYear: number;
  month: HMonthValue;
  name: string;
  roshChodeshDate: string;
}

export interface Holiday {
  date: string;
  name: string;
  hebrewName: string;
}

export interface RoshChodesh {
  month: HMonthValue;
  date: string;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const HEBREW_MONTH_NAMES: Record<number, string> = {
  [HMonth.TISHREI]: 'תִּשְׁרֵי',
  [HMonth.CHESHVAN]: 'חֶשְׁוָן',
  [HMonth.KISLEV]: 'כִּסְלֵו',
  [HMonth.TEVET]: 'טֵבֵת',
  [HMonth.SHVAT]: 'שְׁבָט',
  [HMonth.ADAR_I]: 'אֲדָר א׳',
  [HMonth.ADAR_II]: 'אֲדָר ב׳',
  [HMonth.NISAN]: 'נִיסָן',
  [HMonth.IYYAR]: 'אִיָּר',
  [HMonth.SIVAN]: 'סִיוָן',
  [HMonth.TAMUZ]: 'תַּמּוּז',
  [HMonth.AV]: 'אָב',
  [HMonth.ELUL]: 'אֱלוּל',
};

/**
 * Returns the next Hebrew month in calendar order.
 * @hebcal/core numbers months as NISAN=1..ELUL=6, TISHREI=7..ADAR_I=12, ADAR_II=13.
 * Calendar order is Tishrei(7)→Cheshvan(8)→...→Adar(12)→Nisan(1)→...→Elul(6).
 */
function nextMonth(month: HMonthValue, year: number): { month: HMonthValue; year: number } {
  const isLeap = HDate.isLeapYear(year);
  if (month === HMonth.ELUL) {
    // End of the Hebrew year — wrap to Tishrei of next year
    return { month: HMonth.TISHREI, year: year + 1 };
  }
  if (month === HMonth.ADAR_I && !isLeap) {
    // Non-leap year: Adar I is the last winter month, next is Nisan
    return { month: HMonth.NISAN, year };
  }
  if (month === HMonth.ADAR_II) {
    // Leap year: after Adar II comes Nisan
    return { month: HMonth.NISAN, year };
  }
  return { month: month + 1, year };
}

export function getHebrewMonthsForYear(schoolYear: SchoolYear): HebrewMonth[] {
  const startDate = parseDate(schoolYear.startDate);
  const endDate = parseDate(schoolYear.endDate);

  const startHDate = new HDate(startDate);
  const endHDate = new HDate(endDate);

  const result: HebrewMonth[] = [];

  let currentYear = startHDate.getFullYear();
  let currentMonth = startHDate.getMonth() as HMonthValue;

  // Safety cap
  const maxMonths = 40;

  while (result.length < maxMonths) {
    const roshChodesh = new HDate(1, currentMonth, currentYear);
    const roshChodeshGregorian = roshChodesh.greg();

    // Stop if Rosh Chodesh of this month is after the school year end date
    if (roshChodeshGregorian > endDate) break;

    result.push({
      hebrewYear: currentYear,
      month: currentMonth,
      name: HEBREW_MONTH_NAMES[currentMonth] ?? `Month ${currentMonth}`,
      roshChodeshDate: toISODate(roshChodeshGregorian),
    });

    // Stop if we've reached the end month
    if (currentYear === endHDate.getFullYear() && currentMonth === endHDate.getMonth()) {
      break;
    }

    const next = nextMonth(currentMonth, currentYear);
    currentMonth = next.month;
    currentYear = next.year;
  }

  return result;
}

export function toHebrewDate(gregorianDate: string): string {
  const date = parseDate(gregorianDate);
  const hDate = new HDate(date);
  return hDate.render('he');
}

export function getHebrewYearForDate(isoDate: string): number {
  const date = parseDate(isoDate);
  const hDate = new HDate(date);
  return hDate.getFullYear();
}

export function getHebrewBirthday(dob: string): string {
  const dobDate = parseDate(dob);
  const hDob = new HDate(dobDate);

  const todayHDate = new HDate(new Date());
  const currentHebrewYear = todayHDate.getFullYear();

  const birthdayThisYear = new HDate(hDob.getDate(), hDob.getMonth(), currentHebrewYear);
  return toISODate(birthdayThisYear.greg());
}

export function getJewishHolidays(year: number): Holiday[] {
  const options: CalOptions = {
    year,
    isHebrewYear: true,
    il: true,
    sedrot: false,
    omer: false,
    noRoshChodesh: true,
    noMinorFast: false,
    noSpecialShabbat: true,
    noModern: false,
  };

  const events = HebrewCalendar.calendar(options);
  const holidays: Holiday[] = [];

  for (const event of events) {
    const desc = event.getDesc();
    const hebrewDesc = event.render('he') ?? desc;
    const gregorianDate = event.getDate().greg();

    holidays.push({
      date: toISODate(gregorianDate),
      name: desc,
      hebrewName: hebrewDesc,
    });
  }

  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return holidays;
}

export function getRoshChodeshDates(year: number): RoshChodesh[] {
  const isLeap = HDate.isLeapYear(year);
  const monthCount = isLeap ? 13 : 12;
  const result: RoshChodesh[] = [];

  for (let m = 1; m <= monthCount; m++) {
    const roshChodesh = new HDate(1, m, year);
    result.push({
      month: m,
      date: toISODate(roshChodesh.greg()),
    });
  }

  return result;
}
