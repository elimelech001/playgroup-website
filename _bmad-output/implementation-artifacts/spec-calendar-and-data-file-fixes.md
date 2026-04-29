---
title: 'Calendar & Data File Fixes'
type: 'bugfix'
created: '2026-04-29'
status: 'done'
baseline_commit: 'bf7c9e95c934e13dc16a2f14d027604ad8a8ec88'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Five related issues degrade usability: (1) the data-file prompt can silently overwrite an existing file; (2) the calendar has no month navigation in focused view; (3) Hebrew month names are missing from month headers and the calendar grid; (4) users cannot click to toggle vacation days directly on the calendar; (5) the single-month focus view lacks enlarged spacing and readability.

**Approach:** Fix data-file safety in `DataFilePrompt` + `persistence`; add prev/next navigation and Hebrew month labels to `MonthCalendar` + `YearCalendarView`; wire click-to-toggle vacation days through the store; and expand the focused-month layout with more generous sizing.

## Boundaries & Constraints

**Always:**
- Selecting an existing file must never discard its data — `openDataFile` reads and hydrates; `initDataFile` writes an empty state only to a newly-created file.
- Vacation toggles must be persisted via `setCalendar` (the existing write-through path) — no new store actions.
- Hebrew month names must use the existing `HEBREW_MONTH_NAMES` map in `hebrewCalendar.ts`.
- The year-view grid (all months side-by-side) must remain unchanged in layout; only the focused single-month view gets the enlarged treatment.

**Ask First:**
- If the `CalendarConfig` structure needs a schema change beyond `vacationPeriods` start/end pairs (e.g., adding individual vacation days as a separate field), halt and confirm the approach.

**Never:**
- Do not add a new IndexedDB store or localStorage key.
- Do not replace the File System Access API with a different persistence mechanism.
- Do not add a full date-picker or inline calendar to the vacation-toggle flow — click-to-toggle on existing day cells is sufficient.
- Do not change the `CalendarConfigForm` vacation period inputs; individual-day toggling is separate from period ranges.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First-run create file | `lastFileName` is null | Show only "Create Data File" button; clicking opens Save picker and writes empty state | User cancels → silent no-op |
| Returning user opens existing file | `lastFileName` set, user clicks "Open Data File" | Opens picker, reads + validates JSON, hydrates store — existing data intact | Corrupt JSON → show error message |
| Returning user creates new file | `lastFileName` set, user clicks "Create New File" | Opens Save picker; if user picks a new path, writes empty state; if user picks an existing file path, show a confirmation warning before overwriting | User cancels → silent no-op |
| Month navigation (focused view) | User in focused single-month view, clicks "→" | Advances to next Gregorian month in the school year; wraps are disabled at the boundary | At first/last month, the respective nav button is disabled |
| Vacation day toggle | User clicks a school day cell in focused view | Day is added to `vacationPeriods` as a single-day range (start === end) and immediately re-rendered amber | Clicking again removes that single-day range |
| Vacation toggle on holiday | User clicks a holiday-marked day | Day becomes vacation AND holiday (both styles merge) | No error |
| Hebrew month header | Any month rendered | Header shows "September 2025 · אֱלוּל" format | Falls back to English only if Hebrew name lookup fails |

</frozen-after-approval>

## Code Map

- `src/components/shared/DataFilePrompt.tsx` -- data-file UI; add "Create New File" overwrite confirmation
- `src/lib/persistence.ts` -- `initDataFile` is safe already (Save picker = user picks path); no logic change needed here
- `src/components/calendar/MonthCalendar.tsx` -- add Hebrew month subtitle to header; add click handler on day cells for vacation toggle; enlarge cell sizing in focus mode
- `src/components/calendar/YearCalendarView.tsx` -- pass focus-mode flag to MonthCalendar; add prev/next navigation buttons; wire vacation-toggle callback to store
- `src/lib/hebrewCalendar.ts` -- add `getHebrewMonthForDate(isoDate): string` helper that returns the Hebrew month name for any date
- `src/store/calendarSlice.ts` -- confirm `setCalendar` is sufficient (no new actions needed)

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/hebrewCalendar.ts` -- add exported `getHebrewMonthForDate(isoDate: string): string` that converts a Gregorian date to its Hebrew month name string using existing `HEBREW_MONTH_NAMES` map -- avoids duplicating HDate logic in UI components
- [x] `src/components/shared/DataFilePrompt.tsx` -- add an overwrite-confirmation step when returning user clicks "Create New File": after the Save picker resolves but before writing empty state, if the chosen file already has content, show an inline warning and require a second explicit "Yes, overwrite" click -- protects against accidental data loss
- [x] `src/components/calendar/MonthCalendar.tsx` -- (a) add Hebrew month name subtitle under the Gregorian header using `getHebrewMonthForDate`; (b) accept optional `focusMode: boolean` prop — when true, use larger cell sizing (min-h-[52px], bigger font); (c) accept optional `onDayClick?: (date: string) => void` prop and fire it on school-day cell clicks (not on vacation-period days already set from config forms, but allow toggling single-day vacation); (d) visually distinguish clickable cells with a subtle hover ring
- [x] `src/components/calendar/YearCalendarView.tsx` -- (a) pass `focusMode` to `MonthCalendar` when `focusedMonth` is set; (b) render prev/next month nav buttons in focused view, disabled at year boundaries; (c) implement `handleVacationToggle(date: string)` that reads current `CalendarConfig`, adds or removes a single-day `vacationPeriod` entry, then calls `setCalendar` with the updated config; (d) pass `onDayClick={handleVacationToggle}` to `MonthCalendar` in focused view only
- [x] `src/store/calendarSlice.ts` -- verify `setCalendar` triggers auto-save (already in `PERSISTENT_ACTIONS`); no changes expected, but confirm during implementation

**Acceptance Criteria:**
- Given first run (no `lastFileName`), when the prompt renders, then only "Create Data File" is shown — no "Open Data File" button.
- Given returning user, when "Open Data File" is clicked and a valid JSON file is selected, then the app loads with all existing data intact.
- Given returning user clicks "Create New File" and picks a path pointing to a non-empty existing file, when they see the overwrite warning, then the file is only overwritten after explicit second confirmation.
- Given the year calendar view, when any month header is clicked, then the focused single-month view shows the month with a Hebrew month subtitle (e.g. "· אֱלוּל") in the header.
- Given focused single-month view, when the user clicks the "→" next button, then the calendar advances to the next Gregorian month; the button is disabled on the last month of the school year.
- Given focused single-month view, when the user clicks a white (school-day) cell, then that day turns amber (vacation) and the change is persisted; clicking it again restores it to white.
- Given year-view (all months visible), when the user views month cards, then each card header shows the Hebrew month name(s) covering that Gregorian month.
- Given focused single-month view, when rendered, then day cells are visibly larger than in year-view cards.

## Design Notes

**Single-day vacation storage:** A single-day vacation range is stored as `{ start: "YYYY-MM-DD", end: "YYYY-MM-DD" }` with start === end. The toggle removes an existing entry only if both start and end match exactly — it does not split or merge overlapping ranges from the config form.

**Hebrew month spanning:** A Gregorian month can span two Hebrew months (e.g. September spans Elul and Tishrei). `getHebrewMonthForDate` is called for the 1st of the Gregorian month and (if different) the last day, then rendered as "Elul · Tishrei" if they differ or just "Elul" if they match.

**Overwrite guard:** The File System Access API `showSaveFilePicker` returns a handle to whatever file the user chose — the browser does not prevent picking an existing file. The guard must read the file after the picker resolves and before calling `saveData(emptyState())`. If the file has content (size > 0 or valid JSON), the prompt shows a confirmation step. `initDataFile` itself does not change; the guard lives in `DataFilePrompt`.

## Verification

**Commands:**
- `npm run build` -- expected: zero TypeScript errors, clean Vite build

**Manual checks (if no CLI):**
- Open app fresh (clear IndexedDB) → only "Create Data File" shown
- Open app with existing data → "Open Data File" primary, "Create New File" secondary; opening existing file preserves data
- Click "Create New File", pick an existing non-empty file → overwrite warning appears before data is cleared
- Calendar year view → each month card header shows Hebrew month name subtitle
- Click a month header → focused view appears with larger cells and Hebrew subtitle
- In focused view click "→" / "←" to navigate months; buttons disabled at boundaries
- In focused view click a white day cell → turns amber; reload confirms persistence; click again → back to white

## Suggested Review Order

**Data file safety**

- Entry point: two-phase pick → check → confirm flow replaces single `initDataFile` call
  [`DataFilePrompt.tsx:60`](../../src/components/shared/DataFilePrompt.tsx#L60)

- Save-first ordering: data written before handle is committed to IDB/localStorage
  [`persistence.ts:153`](../../src/lib/persistence.ts#L153)

- New exported split API: `pickNewDataFile` and `commitNewDataFile`
  [`persistence.ts:127`](../../src/lib/persistence.ts#L127)

- Overwrite confirmation screen; shows filename, requires explicit second click
  [`DataFilePrompt.tsx:114`](../../src/components/shared/DataFilePrompt.tsx#L114)

**Hebrew month display**

- `getHebrewMonthsForGregorianMonth`: deduplicates and joins names, filters empty strings
  [`hebrewCalendar.ts:181`](../../src/lib/hebrewCalendar.ts#L181)

- Hebrew subtitle rendered under Gregorian header in both year-view and focused-view
  [`MonthCalendar.tsx:46`](../../src/components/calendar/MonthCalendar.tsx#L46)

**Focused-month view: navigation + enlarged layout**

- `focusedIndex` drives prev/next buttons; disabled at school-year boundaries
  [`YearCalendarView.tsx:108`](../../src/components/calendar/YearCalendarView.tsx#L108)

- `focusMode` prop switches cell height from 32px to 52px and scales text
  [`MonthCalendar.tsx:62`](../../src/components/calendar/MonthCalendar.tsx#L62)

**Vacation-day toggle**

- Toggle logic: find exact single-day match, add or remove from `vacationPeriods`, call `setCalendar`
  [`YearCalendarView.tsx:122`](../../src/components/calendar/YearCalendarView.tsx#L122)

- `onDayClick` wired only in focused view; `isClickable` gate controls cursor and hover ring
  [`MonthCalendar.tsx:89`](../../src/components/calendar/MonthCalendar.tsx#L89)
