import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { NotificationItem } from '../types';

export function useNotifications(uid?: string) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as Omit<NotificationItem, 'id'>), id: d.id }));
        // A just-created alert has no server time yet, so treat it as the newest.
        const time = (n: NotificationItem) => n.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
        list.sort((a, b) => time(b) - time(a));
        setItems(list);
        setError('');
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [uid]);

  return { items, loading, error };
}