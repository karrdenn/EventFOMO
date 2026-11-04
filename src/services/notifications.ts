import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_PREFS, NotificationItem, UserProfile } from '../types';

type NewEventInfo = {
  title: string;
  category: string;
  isMandatory: boolean;
  mandatoryFor: string[];
};

// Writes an in-app alert for every user who should hear about a newly published event.
export async function notifyNewEvent(eventId: string, event: NewEventInfo, organizerUid: string) {
  const snap = await getDocs(collection(db, 'users'));
  const users = snap.docs.map((d) => d.data() as UserProfile);

  const alerts: { userId: string; type: 'new' | 'mandatory' }[] = [];
  users.forEach((u) => {
    if (!u.uid || u.uid === organizerUid) return;
    const prefs = { ...DEFAULT_PREFS, ...(u.prefs ?? {}) };
    if (!prefs.allow) return;

    const targeted =
      event.isMandatory &&
      u.role === 'student' &&
      (event.mandatoryFor.length === 0 ||
        event.mandatoryFor.includes(u.year) ||
        (!!u.club && u.club !== 'None' && event.mandatoryFor.includes(u.club)));

    if (targeted && prefs.mandatory) alerts.push({ userId: u.uid, type: 'mandatory' });
    else if (prefs.newEvents) alerts.push({ userId: u.uid, type: 'new' });
  });

  // A batch holds up to 500 writes, so send them in chunks.
  for (let i = 0; i < alerts.length; i += 400) {
    const batch = writeBatch(db);
    alerts.slice(i, i + 400).forEach((a) => {
      batch.set(doc(collection(db, 'notifications')), {
        userId: a.userId,
        eventId,
        type: a.type,
        title: a.type === 'mandatory' ? `Mandatory: ${event.title}` : `New Event: ${event.title}`,
        body:
          a.type === 'mandatory'
            ? 'You are required to attend this event. Tap for details.'
            : `A new event has been posted in ${event.category}. Check it out!`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

export async function markRead(id: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'notifications', id), { isRead: true });
  await batch.commit();
}

export async function markAllRead(items: NotificationItem[]) {
  const unread = items.filter((n) => !n.isRead);
  for (let i = 0; i < unread.length; i += 400) {
    const batch = writeBatch(db);
    unread.slice(i, i + 400).forEach((n) => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
    await batch.commit();
  }
}