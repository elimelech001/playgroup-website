import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStore, useActiveYear } from '@/store';
import { CalendarConfigForm } from './CalendarConfigForm';
import { YearCalendarView } from './YearCalendarView';

export function CalendarTab() {
  const activeYear = useActiveYear();
  const calendar = useStore((s) => s.calendar);
  const [editing, setEditing] = useState(false);

  if (!activeYear) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-stone-500">No active school year. Create one using the school year switcher.</p>
      </div>
    );
  }

  const hasCalendar = calendar !== null && calendar.schoolYearId === activeYear.id;

  if (!hasCalendar || editing) {
    return (
      <CalendarConfigForm
        existing={hasCalendar ? calendar : undefined}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">{activeYear.name} Calendar</h2>
        <Button
          variant="outline"
          className="border-stone-300 text-stone-700"
          onClick={() => setEditing(true)}
        >
          Edit Calendar
        </Button>
      </div>
      <YearCalendarView config={calendar} onEdit={() => setEditing(true)} />
    </div>
  );
}
