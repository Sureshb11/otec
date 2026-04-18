// ─── Kuwait Time Formatting ───────────────────────────────────────────────────
// Single source of truth for displaying timestamps across the app.
// OTEC operates in Kuwait (Asia/Kuwait = UTC+3, no DST), so every date we
// render to the screen should be formatted in that timezone — regardless of
// where the operator's laptop thinks it is. Backend stores UTC; these helpers
// convert on display only.

export const KUWAIT_TZ = 'Asia/Kuwait';

type DateInput = Date | string | number | null | undefined;

const toDate = (d: DateInput): Date | null => {
  if (d === null || d === undefined || d === '') return null;
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? null : date;
};

/** "17 Apr 2026 10:01 pm" — card / list display for full date+time. */
export const fmtKwDateTime = (d: DateInput, fallback = '—'): string => {
  const date = toDate(d);
  if (!date) return fallback;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KUWAIT_TZ,
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return `${get('day')} ${get('month')} ${get('year')} ${get('hour')}:${get('minute')} ${get('dayPeriod').toLowerCase()}`;
};

/** "17 Apr 2026" — date only. */
export const fmtKwDate = (d: DateInput, fallback = '—'): string => {
  const date = toDate(d);
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: KUWAIT_TZ,
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
};

/** "Friday, 17 Apr 2026" — long weekday + date. */
export const fmtKwLongDate = (d: DateInput, fallback = '—'): string => {
  const date = toDate(d);
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: KUWAIT_TZ,
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
};

/** "22:07:34" — 24-hour wall clock. */
export const fmtKwClock = (d: DateInput, fallback = '—'): string => {
  const date = toDate(d);
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: KUWAIT_TZ,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
};

/** "10:01 pm" — 12-hour time only. */
export const fmtKwTime12 = (d: DateInput, fallback = '—'): string => {
  const date = toDate(d);
  if (!date) return fallback;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KUWAIT_TZ,
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return `${get('hour')}:${get('minute')} ${get('dayPeriod').toLowerCase()}`;
};
