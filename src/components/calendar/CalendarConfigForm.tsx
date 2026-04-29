import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HebrewDatePicker } from '@/components/ui/HebrewDatePicker';
import { useStore, useActiveYear } from '@/store';
import { toHebrewDate } from '@/lib/hebrewCalendar';
import type { CalendarConfig } from '@/types';

interface CalendarConfigFormProps {
  existing?: CalendarConfig;
  onSaved: () => void;
}

type VacationEntry = { start: string; end: string };
type EventEntry = { date: string; label: string };


export function CalendarConfigForm({ existing, onSaved }: CalendarConfigFormProps) {
  const setCalendar = useStore((s) => s.setCalendar);
  const activeYear = useActiveYear();

  // Pre-fill from the active school year's dates when no existing config is present
  const [firstDay, setFirstDay] = useState(existing?.firstDay ?? activeYear?.startDate ?? '');
  const [lastDay, setLastDay] = useState(existing?.lastDay ?? activeYear?.endDate ?? '');
  const [vacations, setVacations] = useState<VacationEntry[]>(
    existing?.vacationPeriods ?? []
  );
  const [events, setEvents] = useState<EventEntry[]>(
    existing?.specialEvents ?? []
  );

  function handleFirstDayChange(value: string) {
    setFirstDay(value);
  }

  function addVacation() {
    setVacations((v) => [...v, { start: '', end: '' }]);
  }

  function removeVacation(idx: number) {
    setVacations((v) => v.filter((_, i) => i !== idx));
  }

  function updateVacation(idx: number, field: 'start' | 'end', value: string) {
    setVacations((v) => v.map((vac, i) => (i === idx ? { ...vac, [field]: value } : vac)));
  }

  function addEvent() {
    setEvents((e) => [...e, { date: '', label: '' }]);
  }

  function removeEvent(idx: number) {
    setEvents((e) => e.filter((_, i) => i !== idx));
  }

  function updateEvent(idx: number, field: 'date' | 'label', value: string) {
    setEvents((e) => e.map((ev, i) => (i === idx ? { ...ev, [field]: value } : ev)));
  }

  function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!activeYear || !firstDay || !lastDay) return;

    const config: CalendarConfig = {
      schoolYearId: activeYear.id,
      firstDay,
      lastDay,
      vacationPeriods: vacations.filter((v) => v.start && v.end),
      specialEvents: events.filter((ev) => ev.date && ev.label),
    };
    setCalendar(config);
    onSaved();
  }

  // Show the Hebrew year of the chosen start date so the user can verify it
  const hebrewStartLabel = firstDay ? toHebrewDate(firstDay) : null;

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold text-stone-800">Configure School Year Calendar</h2>

      {/* Start / End dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cal-first-day">
            First Day of School <span className="text-rose-600" aria-hidden="true">*</span>
          </Label>
          <HebrewDatePicker
            id="cal-first-day"
            value={firstDay}
            onChange={handleFirstDayChange}
            required
          />
          {hebrewStartLabel && (
            <p className="text-xs text-stone-400 dir-rtl" dir="rtl">{hebrewStartLabel}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="cal-last-day">
            Last Day of School <span className="text-rose-600" aria-hidden="true">*</span>
          </Label>
          <HebrewDatePicker
            id="cal-last-day"
            value={lastDay}
            onChange={setLastDay}
            required
          />
        </div>
      </div>

      {/* Vacation periods */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Vacation Periods</span>
          <Button type="button" variant="outline" className="text-xs h-7 px-2" onClick={addVacation}>
            + Add Vacation
          </Button>
        </div>
        {vacations.map((vac, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <HebrewDatePicker
              value={vac.start}
              onChange={(v) => updateVacation(idx, 'start', v)}
              aria-invalid={undefined}
              className="flex-1"
            />
            <span className="text-stone-400 text-sm">–</span>
            <HebrewDatePicker
              value={vac.end}
              onChange={(v) => updateVacation(idx, 'end', v)}
              aria-invalid={undefined}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeVacation(idx)}
              aria-label={`Remove vacation ${idx + 1}`}
              className="text-stone-400 hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {vacations.length === 0 && (
          <p className="text-stone-400 text-xs">No vacation periods added.</p>
        )}
      </div>

      {/* Special events */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Special Events</span>
          <Button type="button" variant="outline" className="text-xs h-7 px-2" onClick={addEvent}>
            + Add Event
          </Button>
        </div>
        {events.map((ev, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <HebrewDatePicker
              value={ev.date}
              onChange={(v) => updateEvent(idx, 'date', v)}
              aria-invalid={undefined}
              className="w-48 shrink-0"
            />
            <Input
              type="text"
              value={ev.label}
              onChange={(e) => updateEvent(idx, 'label', e.target.value)}
              placeholder="Event name"
              aria-label={`Event ${idx + 1} name`}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeEvent(idx)}
              aria-label={`Remove event ${idx + 1}`}
              className="text-stone-400 hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-stone-400 text-xs">No special events added.</p>
        )}
      </div>

      <Button
        type="submit"
        className="bg-teal-700 text-white hover:bg-teal-800"
        disabled={!firstDay || !lastDay}
      >
        Save Calendar
      </Button>
    </form>
  );
}
