import { cn } from '@/lib/utils';
import type { DayInfo } from './YearCalendarView';

interface MonthCalendarProps {
  year: number;
  month: number;
  days: DayInfo[];
  onMonthClick?: (year: number, month: number) => void;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MonthCalendar({ year, month, days, onMonthClick }: MonthCalendarProps) {
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOffset = new Date(year, month - 1, 1).getDay();

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 min-w-[210px]">
      <h3
        className={cn(
          'text-sm font-semibold text-stone-700 mb-2 text-center',
          onMonthClick && 'cursor-pointer hover:text-teal-700 transition-colors',
        )}
        onClick={() => onMonthClick?.(year, month)}
        title={onMonthClick ? `View ${monthName}` : undefined}
      >
        {monthName}
      </h3>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_LABELS.map((wd) => (
          <div key={wd} className="text-center text-[10px] text-stone-400 font-medium py-0.5">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const hasHoliday = day.holidays.length > 0;
          const hasEvent = day.events.length > 0;
          const allLabels = [
            ...day.holidays.map((h) => h.hebrewName),
            ...day.events,
          ];

          return (
            <div
              key={day.date}
              title={allLabels.length > 0 ? allLabels.join(', ') : undefined}
              className={cn(
                'relative flex flex-col items-center justify-start rounded-sm text-xs pt-1 pb-0.5 px-0.5 min-h-[32px] overflow-hidden',
                day.isVacation
                  ? 'bg-amber-50 text-stone-400 border border-amber-200'
                  : 'bg-white text-stone-800',
                (day.isFirstDay || day.isLastDay) && 'ring-2 ring-teal-600 ring-offset-1',
                hasHoliday && !day.isVacation && 'bg-sky-50',
                hasEvent && !day.isVacation && 'bg-violet-50',
              )}
            >
              <span className="leading-none font-medium">{day.day}</span>

              {/* Holiday dot indicator */}
              {hasHoliday && (
                <span
                  className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400"
                  aria-hidden="true"
                />
              )}

              {day.holidays.map((h) => (
                <span
                  key={h.name}
                  className="text-[8px] text-sky-700 leading-tight truncate w-full text-center block"
                >
                  {h.hebrewName}
                </span>
              ))}
              {day.events.map((ev) => (
                <span
                  key={ev}
                  className="text-[8px] text-violet-700 leading-tight truncate w-full text-center block font-medium"
                >
                  {ev}
                </span>
              ))}
              {day.isVacation && !hasHoliday && !hasEvent && (
                <span className="text-[8px] text-amber-500 leading-tight">חופש</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
