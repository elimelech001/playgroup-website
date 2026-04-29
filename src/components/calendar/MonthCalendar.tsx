import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getHebrewMonthsForGregorianMonth, getHebrewDayLabel } from '@/lib/hebrewCalendar';
import { BIRTHDAY_COLORS } from './YearCalendarView';
import type { DayInfo } from './YearCalendarView';

interface MonthCalendarProps {
  year: number;
  month: number;
  days: DayInfo[];
  focusMode?: boolean;
  onMonthClick?: (year: number, month: number) => void;
  onDayClick?: (date: string) => void;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function BirthdayTooltip({ names }: { names: string[] }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none">
      <div className="bg-stone-800 text-white text-[10px] rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
        {names.map((n) => `🎂 ${n}`).join('\n').split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <div className="w-2 h-2 bg-stone-800 rotate-45 mx-auto -mt-1" />
    </div>
  );
}

export function MonthCalendar({
  year,
  month,
  days,
  focusMode = false,
  onMonthClick,
  onDayClick,
}: MonthCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  });

  const hebrewMonthLabel = getHebrewMonthsForGregorianMonth(year, month);

  // Always offset from day 1 of the Gregorian month so the grid aligns correctly
  const firstDayOffset = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  // Build a lookup so every calendar day number maps to its DayInfo (if in school year range)
  const dayMap = new Map<number, DayInfo>(days.map((d) => [d.day, d]));

  return (
    <div
      className={cn(
        'bg-white border border-stone-200 rounded-lg',
        focusMode ? 'p-5 w-full max-w-xl' : 'p-3 min-w-[210px]',
      )}
    >
      <div className="mb-2 text-center">
        <h3
          className={cn(
            'font-semibold text-stone-700',
            focusMode ? 'text-base' : 'text-sm',
            onMonthClick && 'cursor-pointer hover:text-teal-700 transition-colors',
          )}
          onClick={() => onMonthClick?.(year, month)}
          title={onMonthClick ? `View ${monthName}` : undefined}
        >
          {monthName}
        </h3>
        {hebrewMonthLabel && (
          <p
            className={cn(
              'text-stone-400 font-medium leading-tight',
              focusMode ? 'text-sm mt-0.5' : 'text-[10px]',
            )}
            dir="rtl"
          >
            {hebrewMonthLabel}
          </p>
        )}
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_LABELS.map((wd) => (
          <div
            key={wd}
            className={cn(
              'text-center text-stone-400 font-medium py-0.5',
              focusMode ? 'text-xs' : 'text-[10px]',
            )}
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
          const day = dayMap.get(dayNum);
          // Day outside school year range — render as empty greyed cell
          if (!day) {
            return (
              <div
                key={`out-${dayNum}`}
                className={cn(
                  'flex flex-col items-center justify-start rounded-sm pt-1 pb-0.5 px-0.5',
                  focusMode ? 'min-h-[52px]' : 'min-h-[32px]',
                  'bg-stone-50',
                )}
              >
                <span className={cn('leading-none font-medium text-stone-300', focusMode ? 'text-sm' : 'text-xs')}>
                  {dayNum}
                </span>
              </div>
            );
          }
          const hasHoliday = day.holidays.length > 0;
          const hasEvent = day.events.length > 0;
          const hasBirthday = day.birthdays.length > 0;
          const isClickable = focusMode && !!onDayClick;
          const hebrewDay = getHebrewDayLabel(day.date);

          // Birthday: use first child's color for the cell bg; if multiple, show party hat
          const primaryBirthday = hasBirthday ? day.birthdays[0] : null;
          const [bdayBg, bdayText, bdayRing] = primaryBirthday
            ? BIRTHDAY_COLORS[primaryBirthday.colorIndex]
            : ['', '', ''];

          const allLabels = [
            ...day.holidays.map((h) => h.hebrewName),
            ...day.events,
          ];

          const isHovered = hoveredDate === day.date;
          const showBdayTooltip = hasBirthday && isHovered;

          return (
            <div
              key={day.date}
              title={!hasBirthday && allLabels.length > 0 ? allLabels.join(', ') : undefined}
              onClick={isClickable ? () => onDayClick(day.date) : undefined}
              onMouseEnter={hasBirthday ? () => setHoveredDate(day.date) : undefined}
              onMouseLeave={hasBirthday ? () => setHoveredDate(null) : undefined}
              className={cn(
                'relative flex flex-col items-center justify-start rounded-sm pt-1 pb-0.5 px-0.5 overflow-visible',
                focusMode ? 'min-h-[52px] text-sm' : 'min-h-[32px] text-xs',
                // Birthday takes priority for bg
                hasBirthday
                  ? cn(bdayBg, 'ring-1', bdayRing)
                  : day.isVacation
                  ? 'bg-amber-50 text-stone-400 border border-amber-200'
                  : 'bg-white text-stone-800',
                (day.isFirstDay || day.isLastDay) && 'ring-2 ring-teal-600 ring-offset-1',
                !hasBirthday && hasHoliday && !day.isVacation && 'bg-sky-50',
                !hasBirthday && hasEvent && !day.isVacation && 'bg-violet-50',
                isClickable && 'cursor-pointer hover:ring-2 hover:ring-teal-300 hover:ring-offset-1 transition-shadow',
              )}
            >
              {/* Tooltip for birthdays */}
              {showBdayTooltip && (
                <BirthdayTooltip names={day.birthdays.map((b) => b.name)} />
              )}

              {/* Day number */}
              <span className={cn(
                'leading-none font-medium',
                focusMode ? 'text-sm' : '',
                hasBirthday ? bdayText : '',
              )}>
                {day.day}
              </span>

              {/* Hebrew day numeral */}
              {hebrewDay && (
                <span
                  className={cn(
                    'leading-none',
                    focusMode ? 'text-[10px] mt-0.5' : 'text-[7px]',
                    hasBirthday ? cn(bdayText, 'opacity-70') : 'text-stone-400',
                  )}
                  dir="rtl"
                >
                  {hebrewDay}
                </span>
              )}

              {/* Birthday display */}
              {hasBirthday && (
                <span
                  className={cn(
                    'leading-tight w-full text-center block truncate',
                    focusMode ? 'text-[10px] mt-0.5' : 'text-[7px]',
                    bdayText,
                  )}
                >
                  {day.birthdays.length === 1
                    ? `🎂 ${day.birthdays[0].name.split(' ')[0]}`
                    : `🎂×${day.birthdays.length}`}
                </span>
              )}

              {/* Holiday dot (when no birthday) */}
              {!hasBirthday && hasHoliday && (
                <span
                  className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400"
                  aria-hidden="true"
                />
              )}

              {/* Holiday / event / vacation labels (only when no birthday) */}
              {!hasBirthday && day.holidays.map((h, i) => (
                <span
                  key={`h-${i}`}
                  className={cn(
                    'text-sky-700 leading-tight truncate w-full text-center block',
                    focusMode ? 'text-[10px]' : 'text-[8px]',
                  )}
                >
                  {h.hebrewName}
                </span>
              ))}
              {!hasBirthday && day.events.map((ev, i) => (
                <span
                  key={`e-${i}`}
                  className={cn(
                    'text-violet-700 leading-tight truncate w-full text-center block font-medium',
                    focusMode ? 'text-[10px]' : 'text-[8px]',
                  )}
                >
                  {ev}
                </span>
              ))}
              {!hasBirthday && day.isVacation && !hasHoliday && !hasEvent && (
                <span
                  className={cn(
                    'text-amber-500 leading-tight',
                    focusMode ? 'text-[10px]' : 'text-[8px]',
                  )}
                >
                  חופש
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
