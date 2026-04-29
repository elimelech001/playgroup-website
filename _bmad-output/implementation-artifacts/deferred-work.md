# Deferred Work

## From: Calendar & Data File Fixes (spec-calendar-and-data-file-fixes.md) — 2026-04-29

- **Rapid double-click vacation toggle creates duplicate entries.** In `YearCalendarView.tsx`, clicking a day cell twice quickly before React re-renders causes `handleVacationToggle` to read the same `config` snapshot both times, resulting in two `{start, end}` entries for the same date. Both are then removed by a single subsequent click (the filter removes all exact matches), so the net effect is: add, add, remove-both — instead of add, remove. Mitigation: debounce `onDayClick` or read fresh state from the store (not the prop) inside the toggle handler.

- **Multi-day vacation range covering a clicked date allows adding a redundant single-day entry on top.** If a date is already covered by a range `vacationPeriod` (start ≠ end), clicking it in focus mode will still add a `{start: date, end: date}` entry because the `find` only matches exact single-day entries. The day visually appears as vacation (correct) but now has two overlapping records. The single-day entry cannot be removed via the toggle because the range entry is what marks it as vacation. To fix properly, the toggle should check if a date falls within any existing range, and if so offer to either remove it from the range (split) or do nothing.

- **Empty month card in focused/year view.** If the school year starts or ends mid-month, the first/last month card contains only a few days. The focused-month view renders correctly but with sparse content and no indication this is expected. A label like "Partial month" could improve clarity.
