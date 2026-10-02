import { addDays, format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

export const fmt = (d: Date | string | null | undefined, pattern = "dd/MM/yyyy HH:mm") => {
  if (!d) return '';
  const dt = typeof d === 'string' ? parseISO(d) : d;
  return format(dt, pattern);
};

export const fmtDate = (d: Date | string | null | undefined) => fmt(d, 'dd/MM/yyyy');
export const fmtTime = (d: Date | string | null | undefined) => fmt(d, 'HH:mm');

export function rangeToday() { const s = startOfDay(new Date()); return { e: s, s: endOfDay(s) }; }
export function rangeYesterday() { const y = subDays(new Date(), 1); return { e: startOfDay(y), s: endOfDay(y) }; }
export function rangeLast7() { return { e: startOfDay(subDays(new Date(), 6)), s: endOfDay(new Date()) }; }
export function rangeLast30() { return { e: startOfDay(subDays(new Date(), 29)), s: endOfDay(new Date()) }; }
export function rangeThisMonth() { return { e: startOfMonth(new Date()), s: endOfMonth(new Date()) }; }
export function rangeLastMonth() { const m = subDays(startOfMonth(new Date()), 1); return { e: startOfMonth(m), s: endOfMonth(m) }; }
export function rangeThisYear() { return { e: startOfYear(new Date()), s: endOfYear(new Date()) }; }