import { Timestamp } from 'firebase/firestore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function time12(d: Date): string {
  const h24 = d.getHours();
  const h12 = h24 % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${String(h12).padStart(2, '0')}:${minutes} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

// Example: "26 Sep, 09:00 AM"
export function formatDateTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time12(d)}`;
}

// Example: "Saturday, 26 Sep 2026"
export function formatLongDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Example: "09:00 AM – 12:00 PM"
export function formatTimeRange(
  start: Timestamp | null | undefined,
  end: Timestamp | null | undefined
): string {
  if (!start) return '';
  if (!end) return time12(start.toDate());
  return `${time12(start.toDate())} – ${time12(end.toDate())}`;
}