import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerForPush } from '../services/push';

export function usePushRegistration() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  useEffect(() => {
    if (!uid) return;
    registerForPush(uid).catch((e) => console.warn('Push registration failed', e));
  }, [uid]);
}