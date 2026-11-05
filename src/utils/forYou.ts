import { EventItem } from '../types';
import { appliesToStudent } from './mandatory';

export type ForYouReason = 'mandatory' | 'club' | 'other';
export type RankedEvent = { event: EventItem; reason: ForYouReason };

// Organizers that are clubs. A club's events are the ones organized by that club.
const CLUB_ORGANIZERS = ['ACM', 'BRCS', 'NDLD'];

// Why an event matters to this student.
export function reasonFor(
  event: EventItem,
  year: string,
  club: string,
  attended: boolean
): ForYouReason {
  if (event.isMandatory && !attended && appliesToStudent(event, year, club)) return 'mandatory';
  if (club && club !== 'None' && CLUB_ORGANIZERS.includes(club) && event.organizerName === club) {
    return 'club';
  }
  return 'other';
}

// Orders events: required for you, then your club's, then the rest. Soonest first inside each group.
export function rankForYou(
  events: EventItem[],
  year: string,
  club: string,
  attendedIds: Set<string>
): RankedEvent[] {
  const order: Record<ForYouReason, number> = { mandatory: 0, club: 1, other: 2 };
  return events
    .map((event) => ({
      event,
      reason: reasonFor(event, year, club, attendedIds.has(event.eventId)),
    }))
    .sort(
      (a, b) =>
        order[a.reason] - order[b.reason] ||
        a.event.startTime.toMillis() - b.event.startTime.toMillis()
    );
}