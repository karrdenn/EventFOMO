import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

// The ids of the events this user has saved (bookmarked).
export function useSavedIds(uid: string | undefined) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) {
      setIds(new Set());
      return;
    }
    const q = query(collection(db, 'savedEvents'), where('userId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => setIds(new Set(snap.docs.map((d) => d.data().eventId as string))),
      () => {}
    );
    return unsubscribe;
  }, [uid]);

  return ids;
}