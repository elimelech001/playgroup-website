import { useState, useRef, useEffect } from 'react';
import { HDate } from '@hebcal/core';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getHebrewMonthsForGregorianMonth } from '@/lib/hebrewCalendar';

interface HebrewDatePickerProps {
  id?: string;
  value: string; // ISO YYYY-MM-DD
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  'aria-invalid'?: 'true' | undefined;
  required?: boolean;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const YEAR_RANGE_START = 2000;
const YEAR_RANGE_END = 2060;
const YEAR_OPTIONS = Array.from(
  { length: YEAR_RANGE_END - YEAR_RANGE_START + 1 },
  (_, i) => YEAR_RANGE_START + i,
);

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}


function getHebrewDayLabel(year: number, month: number, day: number): string {
  try {
    const hd = new HDate(new Date(year, month, day));
    return hd.render('he').split(' ')[0];
  } catch {
    return '';
  }
}

function getFullHebrewDate(iso: string): string {
  if (!iso) return '';
  try {
    const parsed = parseISO(iso);
    if (!parsed) return '';
    const hd = new HDate(new Date(parsed.year, parsed.month, parsed.day));
    return hd.render('he');
  } catch {
    return '';
  }
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const parsed = parseISO(iso);
  if (!parsed) return iso;
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month + 1).padStart(2, '0')}/${parsed.year}`;
}

function parseTextInput(text: string): string | null {
  const trimmed = text.trim();
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch.map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;
  return null;
}

export function HebrewDatePicker({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'DD/MM/YYYY',
  className,
  'aria-invalid': ariaInvalid,
}: HebrewDatePickerProps) {
  const today = new Date();
  const parsed = parseISO(value);

  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(value ? formatDisplay(value) : '');
  const [inputError, setInputError] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const yearListRef = useRef<HTMLDivElement>(null);
  const monthListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display text when value changes externally
  useEffect(() => {
    setInputText(value ? formatDisplay(value) : '');
    setInputError(false);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showYearDropdown && yearListRef.current) {
      const selected = yearListRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'center' });
    }
  }, [showYearDropdown]);

  useEffect(() => {
    if (showMonthDropdown && monthListRef.current) {
      const selected = monthListRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'center' });
    }
  }, [showMonthDropdown]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(day: number) {
    onChange(toISODate(viewYear, viewMonth, day));
    setOpen(false);
    onBlur?.();
  }

  function commitInput(text: string) {
    if (!text.trim()) {
      onChange('');
      setInputError(false);
      return;
    }
    const iso = parseTextInput(text);
    if (iso) {
      const p = parseISO(iso);
      if (p) { setViewYear(p.year); setViewMonth(p.month); }
      onChange(iso);
      setInputError(false);
      setOpen(false);
      onBlur?.();
    } else {
      setInputError(true);
    }
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const hebrewLabel = value ? getFullHebrewDate(value) : '';
  const hebrewMonthHeader = getHebrewMonthsForGregorianMonth(viewYear, viewMonth + 1);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setShowYearDropdown(false); setShowMonthDropdown(false); onBlur?.(); } }}>
      <PopoverTrigger asChild>
        {/* Typing directly in this input is the primary way to enter a date */}
        <div
          className={cn(
            'flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
            'focus-within:ring-1 focus-within:ring-ring',
            ariaInvalid === 'true' && 'border-rose-500 focus-within:ring-rose-500',
            inputError && 'border-rose-500',
            className,
          )}
        >
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={inputText}
            placeholder={placeholder}
            aria-invalid={ariaInvalid}
            className={cn(
              'flex-1 min-w-0 bg-transparent outline-none text-sm',
              !inputText && 'text-muted-foreground',
              inputError && 'text-rose-700',
            )}
            onChange={(e) => { setInputText(e.target.value); setInputError(false); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitInput(inputText); }
              if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
            }}
            onBlur={() => {
              // Only commit if the popover isn't handling the blur
              setTimeout(() => {
                if (!open) commitInput(inputText);
              }, 150);
            }}
          />
          {hebrewLabel && (
            <span className="ms-1 shrink-0 text-xs text-stone-400" dir="rtl">{hebrewLabel}</span>
          )}
          <CalendarIcon
            className="ms-1 h-4 w-4 shrink-0 text-stone-400 cursor-pointer"
            onClick={() => { setOpen((v) => !v); inputRef.current?.focus(); }}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-3 select-none space-y-2"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // keep focus in input
      >
        {/* Month/year navigation header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded hover:bg-stone-100 text-stone-600"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {/* Month button with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowMonthDropdown((v) => !v); setShowYearDropdown(false); }}
                className="text-sm font-semibold text-stone-800 hover:text-teal-700 transition-colors px-0.5"
                aria-label="Select month"
              >
                {MONTH_NAMES[viewMonth]}
              </button>
              {showMonthDropdown && (
                <div
                  ref={monthListRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 max-h-48 w-28 overflow-y-auto rounded border border-stone-200 bg-white shadow-lg"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <button
                      key={name}
                      type="button"
                      data-selected={idx === viewMonth}
                      onClick={() => { setViewMonth(idx); setShowMonthDropdown(false); }}
                      className={cn(
                        'block w-full text-left px-3 py-1 text-sm hover:bg-stone-100',
                        idx === viewMonth && 'bg-teal-50 text-teal-800 font-semibold',
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hebrew month inline */}
            {hebrewMonthHeader && (
              <span className="text-xs text-stone-400 font-medium" dir="rtl">
                · {hebrewMonthHeader}
              </span>
            )}

            {/* Year button with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowYearDropdown((v) => !v); setShowMonthDropdown(false); }}
                className="text-sm font-semibold text-teal-700 underline-offset-2 hover:underline px-0.5"
                aria-label="Select year"
              >
                {viewYear}
              </button>
              {showYearDropdown && (
                <div
                  ref={yearListRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 max-h-48 w-20 overflow-y-auto rounded border border-stone-200 bg-white shadow-lg"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      data-selected={y === viewYear}
                      onClick={() => { setViewYear(y); setShowYearDropdown(false); }}
                      className={cn(
                        'block w-full text-left px-3 py-1 text-sm hover:bg-stone-100',
                        y === viewYear && 'bg-teal-50 text-teal-800 font-semibold',
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded hover:bg-stone-100 text-stone-600"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;

            const iso = toISODate(viewYear, viewMonth, day);
            const isSelected = iso === value;
            const isToday = iso === todayISO;
            const hebrewDay = getHebrewDayLabel(viewYear, viewMonth, day);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => selectDay(day)}
                onMouseDown={(e) => e.preventDefault()} // keep focus in input
                className={cn(
                  'flex flex-col items-center justify-center rounded-md py-1 px-0.5 text-xs leading-tight transition-colors min-w-[2.25rem] min-h-[2.5rem]',
                  isSelected
                    ? 'bg-teal-700 text-white'
                    : isToday
                    ? 'bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-300'
                    : 'text-stone-700 hover:bg-stone-100',
                )}
                aria-label={`${iso} / ${hebrewDay}`}
                aria-pressed={isSelected}
              >
                <span className="font-medium">{day}</span>
                {hebrewDay && (
                  <span
                    className={cn(
                      'text-[9px] leading-none mt-0.5',
                      isSelected ? 'text-teal-100' : 'text-stone-400',
                    )}
                    dir="rtl"
                  >
                    {hebrewDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Today / Clear shortcuts */}
        <div className="flex justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="h-7 text-xs text-stone-500 hover:text-teal-700"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const y = today.getFullYear();
              const m = today.getMonth();
              const d = today.getDate();
              setViewYear(y);
              setViewMonth(m);
              onChange(toISODate(y, m, d));
              setOpen(false);
              onBlur?.();
            }}
          >
            Today
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              className="h-7 text-xs text-stone-500 hover:text-rose-600"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange('');
                onBlur?.();
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
