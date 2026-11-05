import { EventItem } from '../types';

// True when a mandatory event applies to a student with this year and club.
// An event with no groups listed applies to everyone.
export function appliesToStudent(event: EventItem, year: string, club: string): boolean {
  const groups = event.mandatoryFor ?? [];
  if (groups.length === 0) return true;
  const hasClub = !!club && club !== 'None';
  return groups.includes(year) || (hasClub && groups.includes(club));
}