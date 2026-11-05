import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { EventItem, UserProfile } from '../types';
import { appliesToStudent } from '../utils/mandatory';

export type HistoryStatus = 'Attended' | 'Missed' | 'Upcoming';
export type HistoryItem = { event: EventItem; status: HistoryStatus };

// Builds a student's attendance history from two live lists:
// all mandatory events, and the check-ins that belong to this student.
export function useAttendanceHistory(profile: UserProfile | null) {
  const [mandatory, setMandatory] = useState<EventItem[]>([]);
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());
  const [eventsReady, setEventsReady] = useState(false);
  const [checkinsReady, setCheckinsReady] = useState(false);
  const [error, setError] = useState('');

  const uid = profile?.uid;
  const isStudent = profile?.role === 'student';

  useEffect(() => {
    // Staff accounts have no attendance history.
    if (!uid || !isStudent) {
      setEventsReady(true);
      setCheckinsReady(true);
      return;
    }

    const unsubEvents = onSnapshot(
      query(collection(db, 'events'), where('isMandatory', '==', true)),
      (snap) => {
        setMandatory(
          snap.docs.map((d) => ({ ...(d.data() as Omit<EventItem, 'eventId'>), eventId: d.id }))
        );
        setEventsReady(true);
      },
      (e) => {
        setError(e.message);
        setEventsReady(true);
      }
    );

    const unsubCheckins = onSnapshot(
      query(collection(db, 'checkins'), where('userId', '==', uid)),
      (snap) => {
        setAttendedIds(new Set(snap.docs.map((d) => d.data().eventId as string)));
        setCheckinsReady(true);
      },
      (e) => {
        setError(e.message);
        setCheckinsReady(true);
      }
    );

    return () => {
      unsubEvents();
      unsubCheckins();
    };
  }, [uid, isStudent]);

  const year = profile?.year ?? '';
  const club = profile?.club ?? '';
  const joinedAt = profile?.createdAt?.toMillis() ?? Date.now();

  const items = useMemo(() => {
    const now = Date.now();
    const list: HistoryItem[] = [];
    for (const event of mandatory) {
      const attended = attendedIds.has(event.eventId);
      const endMs = event.endTime.toMillis();
      const ended = endMs < now;

      // Not counted: events that finished before this account was created.
      if (!attended && ended && endMs < joinedAt) continue;
      // Not counted: events that do not apply to this student's year or club.
      if (!attended && !appliesToStudent(event, year, club)) continue;

      list.push({ event, status: attended ? 'Attended' : ended ? 'Missed' : 'Upcoming' });
    }
    return list.sort((a, b) => b.event.startTime.toMillis() - a.event.startTime.toMillis());
  }, [mandatory, attendedIds, joinedAt, year, club]);

  const counts = useMemo(
    () => ({
      attended: items.filter((i) => i.status === 'Attended').length,
      missed: items.filter((i) => i.status === 'Missed').length,
      upcoming: items.filter((i) => i.status === 'Upcoming').length,
    }),
    [items]
  );

  return {
    items,
    counts,
    completed: counts.attended + counts.missed, // events that have happened (or were attended)
    loading: !(eventsReady && checkinsReady),
    error,
  };
}