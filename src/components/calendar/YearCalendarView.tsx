import { useState } from 'react';
import { MonthCalendar } from './MonthCalendar';
import { getJewishHolidays, getHebrewYearForDate, getHebrewBirthdaysInRange } from '@/lib/hebrewCalendar';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import type { CalendarConfig, Child } from '@/types';
import type { Holiday } from '@/lib/hebrewCalendar';

export interface BirthdayKid {
  name: string;
  colorIndex: number; // 0–11, stable per child
}

export interface DayInfo {
  date: string;
  day: number;
  isVacation: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
  events: string[];
  holidays: Holiday[];
  birthdays: BirthdayKid[];
}

// 12 distinct party-pastel Tailwind color sets [bg, text, ring]
export const BIRTHDAY_COLORS: [string, string, string][] = [
  ['bg-pink-100',   'text-pink-700',   'ring-pink-300'],
  ['bg-violet-100', 'text-violet-700', 'ring-violet-300'],
  ['bg-orange-100', 'text-orange-700', 'ring-orange-300'],
  ['bg-cyan-100',   'text-cyan-700',   'ring-cyan-300'],
  ['bg-lime-100',   'text-lime-700',   'ring-lime-300'],
  ['bg-rose-100',   'text-rose-700',   'ring-rose-300'],
  ['bg-indigo-100', 'text-indigo-700', 'ring-indigo-300'],
  ['bg-amber-100',  'text-amber-700',  'ring-amber-300'],
  ['bg-teal-100',   'text-teal-700',   'ring-teal-300'],
  ['bg-fuchsia-100','text-fuchsia-700','ring-fuchsia-300'],
  ['bg-emerald-100','text-emerald-700','ring-emerald-300'],
  ['bg-sky-100',    'text-sky-700',    'ring-sky-300'],
];

interface YearCalendarViewProps {
  config: CalendarConfig;
  onEdit: () => void;
}

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDatesInRange(startISO: string, endISO: string): string[] {
  const dates: string[] = [];
  const current = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  while (current <= end) {
    dates.push(localISO(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function buildDayInfos(config: CalendarConfig, children: Child[]): DayInfo[] {
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

  // Build birthday map — stable color per child based on sorted position
  const sortedChildren = [...children].sort((a, b) => a.name.localeCompare(b.name));
  const birthdaysByDate = new Map<string, BirthdayKid[]>();
  sortedChildren.forEach((child, idx) => {
    if (!child.dateOfBirth) return;
    const dates = getHebrewBirthdaysInRange(child.dateOfBirth, config.firstDay, config.lastDay);
    for (const date of dates) {
      if (!birthdaysByDate.has(date)) birthdaysByDate.set(date, []);
      birthdaysByDate.get(date)!.push({ name: child.name, colorIndex: idx % BIRTHDAY_COLORS.length });
    }
  });

  return allDates.map((date) => ({
    date,
    day: parseInt(date.slice(8, 10), 10),
    isVacation: vacationDays.has(date),
    isFirstDay: date === config.firstDay,
    isLastDay: date === config.lastDay,
    events: eventsByDate.get(date) ?? [],
    holidays: holidaysByDate.get(date) ?? [],
    birthdays: birthdaysByDate.get(date) ?? [],
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
  const setCalendar = useStore((s) => s.setCalendar);
  const children = useStore(
    useShallow((s) =>
      s.children.filter((c) => c.schoolYearId === config.schoolYearId && c.enrollmentStatus !== 'left')
    )
  );

  const dayInfos = buildDayInfos(config, children);
  const months = groupByGregorianMonth(dayInfos);

  const [focusedMonth, setFocusedMonth] = useState<string | null>(null);

  function handleMonthClick(year: number, month: number) {
    const key = `${year}-${month}`;
    setFocusedMonth((prev) => (prev === key ? null : key));
  }

  // Prev/next navigation within focused view
  const focusedIndex = focusedMonth
    ? months.findIndex((m) => `${m.year}-${m.month}` === focusedMonth)
    : -1;

  function handlePrev() {
    if (focusedIndex > 0) {
      const m = months[focusedIndex - 1];
      setFocusedMonth(`${m.year}-${m.month}`);
    }
  }

  function handleNext() {
    if (focusedIndex < months.length - 1) {
      const m = months[focusedIndex + 1];
      setFocusedMonth(`${m.year}-${m.month}`);
    }
  }

  // Vacation toggle: add or remove a single-day vacationPeriod entry
  function handleVacationToggle(date: string) {
    const existing = config.vacationPeriods.find(
      (vp) => vp.start === date && vp.end === date
    );
    const updated: CalendarConfig = {
      ...config,
      vacationPeriods: existing
        ? config.vacationPeriods.filter((vp) => !(vp.start === date && vp.end === date))
        : [...config.vacationPeriods, { start: date, end: date }],
    };
    setCalendar(updated);
  }

  const displayMonths = focusedMonth
    ? months.filter((m) => `${m.year}-${m.month}` === focusedMonth)
    : months;

  return (
    <div className="space-y-4">
      {focusedMonth ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFocusedMonth(null)}
            className="text-sm text-teal-700 hover:underline"
          >
            ← Back to year view
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={handlePrev}
              disabled={focusedIndex <= 0}
              className="px-3 py-1 rounded border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={focusedIndex >= months.length - 1}
              className="px-3 py-1 rounded border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>
      ) : null}

      <div className={focusedMonth ? 'flex justify-center' : 'flex flex-wrap gap-4'}>
        {displayMonths.map((m) => (
          <MonthCalendar
            key={`${m.year}-${m.month}`}
            year={m.year}
            month={m.month}
            days={m.days}
            focusMode={!!focusedMonth}
            onMonthClick={focusedMonth ? undefined : handleMonthClick}
            onDayClick={focusedMonth ? handleVacationToggle : undefined}
          />
        ))}
      </div>

      {focusedMonth && (
        <p className="text-center text-xs text-stone-400">
          Click any day to mark / unmark it as a vacation day
        </p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-white border border-stone-300 inline-block" />
          School day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-pink-100 ring-1 ring-pink-300 inline-block" />
          🎂 Birthday
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
