import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { EventItem } from '../types';

// Live data for one event. It updates by itself if the organizer edits it.
export function useEvent(eventId: string) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'events', eventId),
      (snap) => {
        if (snap.exists()) {
          setEvent({ ...(snap.data() as Omit<EventItem, 'eventId'>), eventId: snap.id });
          setNotFound(false);
        } else {
          setEvent(null);
          setNotFound(true);
        }
        setError('');
        setLoading(false);
      },
      () => {
        setError('Could not load this event. Check your internet connection.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [eventId]);

  return { event, loading, notFound, error };
}