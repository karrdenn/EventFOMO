import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as Crypto from 'expo-crypto';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../hooks/useEvent';
import { makeQrPayload } from '../services/checkin';
import { colors, radius, spacing } from '../theme';

type ShowQrRoute = RouteProp<{ ShowQR: { eventId: string } }, 'ShowQR'>;

const ROTATE_SECONDS = 30;

function newToken(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ShowQRScreen() {
  const { eventId } = useRoute<ShowQrRoute>().params;
  const { profile } = useAuth();
  const { event, loading } = useEvent(eventId);

  const [token, setToken] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(ROTATE_SECONDS);
  const [count, setCount] = useState(0);
  const [problem, setProblem] = useState('');
  const lastToken = useRef('');

  const isOwner = !!event && !!profile && event.organizerId === profile.uid;

  // Publish a new token now and then every 30 seconds.
  useEffect(() => {
    if (!isOwner) return;
    let active = true;
    const rotate = async () => {
      const next = newToken();
      try {
        await setDoc(doc(db, 'events', eventId, 'qr', 'current'), {
          token: next,
          prevToken: lastToken.current,
          issuedAt: serverTimestamp(),
        });
        if (!active) return;
        lastToken.current = next;
        setToken(next);
        setSecondsLeft(ROTATE_SECONDS);
        setProblem('');
      } catch {
        if (active) setProblem('Could not refresh the code. Check your internet connection.');
      }
    };
    rotate();
    const id = setInterval(rotate, ROTATE_SECONDS * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [eventId, isOwner]);

  // Countdown shown under the code.
  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // Live number of students checked in.
  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'checkins'),
      where('eventId', '==', eventId),
      where('organizerId', '==', profile.uid)
    );
    return onSnapshot(q, (snap) => setCount(snap.size), () => {});
  }, [eventId, profile?.uid]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event || !isOwner) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Only the organizer of this event can show its QR code.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>
      <Text style={styles.sub}>Students scan this code to check in</Text>

      <View style={styles.qrBox}>
        {token ? (
          <QRCode value={makeQrPayload(eventId, token)} size={260} />
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>

      <Text style={styles.timer}>Refreshes in {secondsLeft}s</Text>
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}

      <View style={styles.countBox}>
        <Text style={styles.countNumber}>{count}</Text>
        <Text style={styles.countLabel}>checked in</Text>
      </View>

      <Text style={styles.note}>
        Check-in is open from 15 minutes before the start until the event ends. Keep this screen open.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  message: { color: colors.textMuted, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  qrBox: {
    width: 300,
    height: 300,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  timer: { marginTop: spacing.md, color: colors.primary, fontWeight: '700' },
  problem: { marginTop: 8, color: colors.mandatoryText, textAlign: 'center' },
  countBox: { alignItems: 'center', marginTop: spacing.lg },
  countNumber: { fontSize: 40, fontWeight: '800', color: colors.text },
  countLabel: { color: colors.textMuted },
  note: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
});