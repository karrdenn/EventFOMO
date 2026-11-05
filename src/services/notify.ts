import {
    Timestamp,
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where,
    writeBatch,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { EventItem, NotificationType, UserProfile } from '../types';
  import { appliesToStudent } from '../utils/mandatory';
  
  // The few event fields the notifications need.
  export type NotifyEvent = Pick<
    EventItem,
    'eventId' | 'title' | 'category' | 'isMandatory' | 'mandatoryFor' | 'startTime'
  >;
  
  type PrefKey = 'newEvents' | 'reminders' | 'mandatory' | 'updates';
  type Draft = {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    relatedEventId: string;
  };
  
  // A missing preference counts as "on". The master switch (allow) turns everything off.
  function prefOn(u: UserProfile, key: PrefKey): boolean {
    const p = u.prefs;
    if (!p) return true;
    return p.allow !== false && p[key] !== false;
  }
  
  // True when this is a mandatory event that applies to this student.
  function isTargeted(ev: NotifyEvent, u: UserProfile): boolean {
    return (
      ev.isMandatory &&
      u.role === 'student' &&
      appliesToStudent(ev as EventItem, u.year ?? '', u.club ?? '')
    );
  }
  
  async function loadUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ ...(d.data() as Omit<UserProfile, 'uid'>), uid: d.id }));
  }
  
  // Firestore allows 500 writes per batch, so save in chunks of 400.
  async function saveAll(drafts: Draft[]) {
    for (let i = 0; i < drafts.length; i += 400) {
      const batch = writeBatch(db);
      for (const d of drafts.slice(i, i + 400)) {
        batch.set(doc(collection(db, 'notifications')), {
          ...d,
          createdAt: serverTimestamp(),
          isRead: false,
        });
      }
      await batch.commit();
    }
  }
  
  // Tells people about a new event. Mandatory events go to the targeted students.
  export async function notifyNewEvent(ev: NotifyEvent, organizerUid: string) {
    const users = await loadUsers();
    const groups = (ev.mandatoryFor ?? []).join(', ');
    const drafts: Draft[] = [];
  
    for (const u of users) {
      if (u.uid === organizerUid) continue;
  
      if (isTargeted(ev, u) && prefOn(u, 'mandatory')) {
        drafts.push({
          userId: u.uid,
          type: 'mandatory',
          relatedEventId: ev.eventId,
          title: `Mandatory: ${ev.title}`,
          body: groups
            ? `You are required to attend (${groups}). Check the date and venue.`
            : 'You are required to attend. Check the date and venue.',
        });
      } else if (prefOn(u, 'newEvents')) {
        drafts.push({
          userId: u.uid,
          type: 'new_event',
          relatedEventId: ev.eventId,
          title: `New Event: ${ev.title}`,
          body: `A new event has been posted in ${ev.category}. Check it out!`,
        });
      }
    }
    await saveAll(drafts);
  }
  
  type EditableFields = {
    title: string;
    venue: string;
    startTime: Timestamp;
    endTime: Timestamp;
    isMandatory: boolean;
    mandatoryFor: string[];
  };
  
  // Which important things changed? An empty list means nobody needs to be told.
  export function describeChanges(oldEvent: EventItem, next: EditableFields): string[] {
    const changes: string[] = [];
    if (oldEvent.title !== next.title) changes.push('title');
    if (
      oldEvent.startTime.toMillis() !== next.startTime.toMillis() ||
      oldEvent.endTime.toMillis() !== next.endTime.toMillis()
    ) {
      changes.push('time');
    }
    if (oldEvent.venue !== next.venue) changes.push('venue');
    const oldGroups = [...(oldEvent.mandatoryFor ?? [])].sort().join('|');
    const newGroups = [...(next.mandatoryFor ?? [])].sort().join('|');
    if (oldEvent.isMandatory !== next.isMandatory || oldGroups !== newGroups) {
      changes.push('attendance requirement');
    }
    return changes;
  }
  
  // Tells the students who saved the event (and, for mandatory events, the targeted students).
  export async function notifyEventUpdated(ev: NotifyEvent, organizerUid: string, changes: string[]) {
    const [users, savedSnap] = await Promise.all([
      loadUsers(),
      getDocs(
        query(
          collection(db, 'savedEvents'),
          where('organizerId', '==', organizerUid),
          where('eventId', '==', ev.eventId)
        )
      ),
    ]);
    const savers = new Set(savedSnap.docs.map((d) => d.data().userId as string));
  
    const text = changes.join(' and ');
    const body = `${text.charAt(0).toUpperCase()}${text.slice(1)} changed. Tap to see the latest details.`;
    const drafts: Draft[] = [];
  
    for (const u of users) {
      if (u.uid === organizerUid) continue;
      const viaMandatory = isTargeted(ev, u) && prefOn(u, 'mandatory');
      const viaSaved = savers.has(u.uid) && prefOn(u, 'updates');
      if (viaMandatory || viaSaved) {
        drafts.push({
          userId: u.uid,
          type: 'update',
          relatedEventId: ev.eventId,
          title: `Event updated: ${ev.title}`,
          body,
        });
      }
    }
    await saveAll(drafts);
  }