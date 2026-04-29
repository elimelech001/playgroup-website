import { useState } from 'react';
import { MonthCalendar } from './MonthCalendar';
import { getJewishHolidays, getHebrewYearForDate } from '@/lib/hebrewCalendar';
import type { CalendarConfig } from '@/types';
import type { Holiday } from '@/lib/hebrewCalendar';

export interface DayInfo {
  date: string;
  day: number;
  isVacation: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
  events: string[];
  holidays: Holiday[];
}

interface YearCalendarViewProps {
  config: CalendarConfig;
  onEdit: () => void;
}

function getDatesInRange(startISO: string, endISO: string): string[] {
  const dates: string[] = [];
  const current = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function buildDayInfos(config: CalendarConfig): DayInfo[] {
  const allDates = getDatesInRange(config.firstDay, config.lastDay);

  const vacationDays = new Set<string>();
  for (const vac of config.vacationPeriods) {
    for (const d of getDatesInRange(vac.start, vac.end)) {
      vacationDays.add(d);
    }
  }

  const eventsByDate = new Map<string, string[]>();
  for (const ev of config.specialEvents) {
    if (!eventsByDate.has(ev.date)) eventsByDate.set(ev.date, []);
    eventsByDate.get(ev.date)!.push(ev.label);
  }

  const startHebrewYear = getHebrewYearForDate(config.firstDay);
  const endHebrewYear = getHebrewYearForDate(config.lastDay);

  const allHolidays: Holiday[] = [];
  for (let y = startHebrewYear; y <= endHebrewYear; y++) {
    allHolidays.push(...getJewishHolidays(y));
  }
  const filteredHolidays = allHolidays.filter(
    (h) => h.date >= config.firstDay && h.date <= config.lastDay
  );

  const holidaysByDate = new Map<string, Holiday[]>();
  for (const h of filteredHolidays) {
    if (!holidaysByDate.has(h.date)) holidaysByDate.set(h.date, []);
    holidaysByDate.get(h.date)!.push(h);
  }

  return allDates.map((date) => ({
    date,
    day: parseInt(date.slice(8, 10), 10),
    isVacation: vacationDays.has(date),
    isFirstDay: date === config.firstDay,
    isLastDay: date === config.lastDay,
    events: eventsByDate.get(date) ?? [],
    holidays: holidaysByDate.get(date) ?? [],
  }));
}

type MonthGroup = { year: number; month: number; days: DayInfo[] };

function groupByGregorianMonth(dayInfos: DayInfo[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const day of dayInfos) {
    const year = parseInt(day.date.slice(0, 4), 10);
    const month = parseInt(day.date.slice(5, 7), 10);
    const key = `${year}-${month}`;
    if (!map.has(key)) map.set(key, { year, month, days: [] });
    map.get(key)!.days.push(day);
  }
  return [...map.values()];
}

export function YearCalendarView({ config }: YearCalendarViewProps) {
  const dayInfos = buildDayInfos(config);
  const months = groupByGregorianMonth(dayInfos);

  // Month detail view: when user clicks a month header, expand it
  const [focusedMonth, setFocusedMonth] = useState<string | null>(null);

  function handleMonthClick(year: number, month: number) {
    const key = `${year}-${month}`;
    setFocusedMonth((prev) => (prev === key ? null : key));
  }

  const displayMonths = focusedMonth
    ? months.filter((m) => `${m.year}-${m.month}` === focusedMonth)
    : months;

  return (
    <div className="space-y-4">
      {focusedMonth && (
        <button
          type="button"
          onClick={() => setFocusedMonth(null)}
          className="text-sm text-teal-700 hover:underline"
        >
          ← Back to year view
        </button>
      )}

      <div className="flex flex-wrap gap-4">
        {displayMonths.map((m) => (
          <MonthCalendar
            key={`${m.year}-${m.month}`}
            year={m.year}
            month={m.month}
            days={m.days}
            onMonthClick={handleMonthClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-white border border-stone-300 inline-block" />
          School day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block" />
          Vacation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sky-50 border border-sky-200 inline-block" />
          Holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-violet-50 border border-violet-200 inline-block" />
          Special event
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm ring-2 ring-teal-600 ring-offset-1 bg-white inline-block" />
          First/Last day
        </span>
      </div>
    </div>
  );
}
