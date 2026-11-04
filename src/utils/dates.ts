import { Timestamp } from 'firebase/firestore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Example: "26 Sep, 09:00 AM"
export function formatDateTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
}