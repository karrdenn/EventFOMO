import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { EventItem } from '../types';

// Live list of every event, soonest first. It updates by itself when data changes.
export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map((d) => ({ ...(d.data() as Omit<EventItem, 'eventId'>), eventId: d.id }))
        );
        setError('');
        setLoading(false);
      },
      () => {
        setError('Could not load events. Check your internet connection.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { events, loading, error };
}