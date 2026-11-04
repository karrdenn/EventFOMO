import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { EventItem } from '../types';

// Saves or un-saves an event. The document id is "<uid>_<eventId>".
export async function toggleSaved(uid: string, event: EventItem, currentlySaved: boolean) {
  const ref = doc(db, 'savedEvents', `${uid}_${event.eventId}`);
  if (currentlySaved) {
    await deleteDoc(ref);
    return;
  }
  // A few event fields are copied so the Calendar can show them quickly.
  await setDoc(ref, {
    userId: uid,
    eventId: event.eventId,
    savedAt: serverTimestamp(),
    status: 'saved',
    title: event.title,
    category: event.category,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    isMandatory: event.isMandatory,
  });
}