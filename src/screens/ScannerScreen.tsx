import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, ParamListBase, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../hooks/useEvent';
import { useAttendedIds } from '../hooks/useAttendedIds';
import { checkIn } from '../services/checkin';
import { colors, radius, spacing } from '../theme';

type ScannerRoute = RouteProp<{ Scanner: { eventId: string } }, 'Scanner'>;
type Result = { ok: boolean; text: string } | null;

export default function ScannerScreen() {
  const { eventId } = useRoute<ScannerRoute>().params;
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { profile } = useAuth();
  const { event, loading } = useEvent(eventId);
  const attendedIds = useAttendedIds(profile?.uid);
  const [permission, requestPermission] = useCameraPermissions();

  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const locked = useRef(false); // stops the camera from sending the same scan many times

  const onScan = async ({ data }: { data: string }) => {
    if (locked.current || !event || !profile) return;
    locked.current = true;
    setBusy(true);
    try {
      await checkIn(event, profile, data, attendedIds.has(event.eventId));
      setResult({ ok: true, text: `You are checked in to ${event.title}.` });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  const scanAgain = () => {
    locked.current = false;
    setResult(null);
  };

  if (loading || !permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        <Text style={styles.message}>EventFOMO needs the camera to scan the check-in code.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        >
          <Text style={styles.buttonText}>{permission.canAskAgain ? 'Allow camera' : 'Open settings'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>This event no longer exists.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={busy || result ? undefined : onScan}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.eventName} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.frame} />
        <Text style={styles.hint}>Point the camera at the organizer's QR code</Text>
        <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch((t) => !t)}>
          <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={18} color="#fff" />
          <Text style={styles.torchText}>{torch ? 'FLASHLIGHT ON' : 'FLASHLIGHT OFF'}</Text>
        </TouchableOpacity>
      </View>

      {(busy || result) && (
        <View style={styles.resultWrap}>
          <View style={styles.resultCard}>
            {busy ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : result ? (
              <>
                <Ionicons
                  name={result.ok ? 'checkmark-circle' : 'close-circle'}
                  size={56}
                  color={result.ok ? '#2E7D32' : '#D32F2F'}
                />
                <Text style={styles.resultTitle}>{result.ok ? 'Checked in!' : 'Check-in failed'}</Text>
                <Text style={styles.resultText}>{result.text}</Text>
                {result.ok ? (
                  <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>Done</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.button} onPress={scanAgain}>
                    <Text style={styles.buttonText}>Scan again</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  message: { color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  eventName: { position: 'absolute', top: 24, color: '#FFB300', fontWeight: '800', fontSize: 15, paddingHorizontal: 24 },
  frame: { width: 240, height: 240, borderWidth: 3, borderColor: '#fff', borderRadius: 20 },
  hint: { color: '#fff', marginTop: 20, fontWeight: '600' },
  torchBtn: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#fff',
  },
  torchText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  resultWrap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  resultCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  resultText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  button: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});