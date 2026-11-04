import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

// The IDs of the events this student has checked in to.
export function useAttendedIds(uid?: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'checkins'), where('userId', '==', uid));
    return onSnapshot(
      q,
      (snap) => setIds(new Set(snap.docs.map((d) => d.data().eventId as string))),
      () => {}
    );
  }, [uid]);

  return ids;
}