import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { EventItem, UserProfile } from '../types';

const EARLY_MINUTES = 15;

// The text inside the organizer's QR code.
export function makeQrPayload(eventId: string, token: string): string {
  return JSON.stringify({ v: 1, e: eventId, t: token });
}

function parseQr(data: string): { eventId: string; token: string } | null {
  try {
    const obj = JSON.parse(data);
    if (obj?.v === 1 && typeof obj.e === 'string' && typeof obj.t === 'string') {
      return { eventId: obj.e, token: obj.t };
    }
  } catch {
    // Not JSON, so not one of our codes.
  }
  return null;
}

// Throws an Error with a message that is safe to show to the student.
export async function checkIn(
  event: EventItem,
  profile: UserProfile,
  scanned: string,
  alreadyCheckedIn: boolean
): Promise<void> {
  if (alreadyCheckedIn) throw new Error('You have already checked in to this event.');

  const qr = parseQr(scanned);
  if (!qr) throw new Error('This is not an EventFOMO check-in code.');
  if (qr.eventId !== event.eventId) throw new Error('This code belongs to a different event.');

  // Friendly messages. The Firestore rules enforce the same limits using server time.
  const now = Date.now();
  if (now < event.startTime.toMillis() - EARLY_MINUTES * 60 * 1000) {
    throw new Error(`Too early. Check-in opens ${EARLY_MINUTES} minutes before the event starts.`);
  }
  if (now > event.endTime.toMillis()) {
    throw new Error('This event has ended, so check-in is closed.');
  }

  try {
    await setDoc(doc(db, 'checkins', `${event.eventId}_${profile.uid}`), {
      eventId: event.eventId,
      userId: profile.uid,
      organizerId: event.organizerId,
      token: qr.token,
      studentName: profile.fullName,
      studentId: profile.studentId,
      year: profile.year ?? '',
      club: profile.club ?? '',
      checkedInAt: serverTimestamp(),
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'permission-denied') {
      throw new Error(
        'Check-in was rejected. The code may have expired, so ask the organizer to show it again and scan right away. If you are not a student, you cannot check in.'
      );
    }
    throw new Error('Could not check in. Check your internet connection and try again.');
  }
}