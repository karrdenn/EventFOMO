import { Timestamp } from 'firebase/firestore';
import { formatDateTime } from './dates';

// "Just now", "5 min ago", "3 hr ago", "2 days ago", then a date.
export function timeAgo(ts: Timestamp | null | undefined): string {
  if (!ts) return 'Just now';
  const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return formatDateTime(ts);
}