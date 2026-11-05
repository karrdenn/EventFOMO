import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NavigationProp,
  ParamListBase,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toggleSaved } from '../services/saved';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../hooks/useEvent';
import { useSavedIds } from '../hooks/useSavedIds';
import { categoryColor } from '../utils/category';
import { formatLongDate, formatTimeRange } from '../utils/dates';
import { colors, radius, spacing } from '../theme';
import { useAttendedIds } from '../hooks/useAttendedIds';
import { appliesToStudent } from '../utils/mandatory';

type EventRoute = RouteProp<{ EventDetails: { eventId: string } }, 'EventDetails'>;

export default function EventDetailsScreen() {
  const { eventId } = useRoute<EventRoute>().params;
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { event, loading, notFound, error } = useEvent(eventId);
  const savedIds = useSavedIds(profile?.uid);
  const attendedIds = useAttendedIds(profile?.uid);
  const attended = attendedIds.has(eventId);

  const isOwner = !!event && !!profile && event.organizerId === profile.uid;
  const isStudent = profile?.role === 'student';
  const saved = savedIds.has(eventId);

  const confirmDelete = () => {
    if (!event) return;
    Alert.alert(
      'Delete event',
      `Delete "${event.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'events', eventId));
              navigation.goBack();
            } catch {
              Alert.alert('Could not delete', 'Check your internet connection and try again.');
            }
          },
        },
      ]
    );
  };

  // The three-dot menu in the top bar, shown only to the organizer.
  useEffect(() => {
    navigation.setOptions({
      headerRight: isOwner
        ? () => (
            <TouchableOpacity
              hitSlop={10}
              onPress={() =>
                Alert.alert('Manage event', undefined, [
                  { text: 'Edit Event', onPress: () => navigation.navigate('EditEvent', { eventId }) },
                  { text: 'Delete Event', style: 'destructive', onPress: confirmDelete },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            >
              <Ionicons name="ellipsis-vertical" size={22} color={colors.primary} />
            </TouchableOpacity>
          )
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, event, navigation, eventId]);

  const onToggleSave = async () => {
    if (!profile || !event) return;
    try {
      await toggleSaved(profile.uid, event, saved);
    } catch {
      Alert.alert('Could not update', 'Check your internet connection and try again.');
    }
  };

  const openSchedule = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open file', 'No app on this phone can open the schedule.')
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || notFound || !event) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.message}>{error || 'This event no longer exists.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tint = categoryColor(event.category);
  const groups = event.mandatoryFor ?? [];
  const mandatoryText = groups.length
    ? `Mandatory for: ${groups.join(', ')}`
    : 'Mandatory for everyone';
  const hasSchedule = !!event.scheduleContent && (event.scheduleType === 'pdf' || event.scheduleType === 'text');

  // The second footer button depends on who is looking at the event.
  const showCheckIn = isStudent && event.isMandatory && !isOwner && !!profile && appliesToStudent(event, profile.year, profile.club);
  const showQr = isOwner && event.isMandatory;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: `${tint}22` }]}>
            <Ionicons name="calendar" size={64} color={tint} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: tint }]}>
              <Text style={styles.tagText}>{event.category}</Text>
            </View>
            {event.isMandatory && (
              <View style={[styles.tag, { backgroundColor: colors.mandatoryBg }]}>
                <Text style={[styles.tagText, { color: colors.mandatoryText }]}>MANDATORY</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>
          {event.isMandatory && <Text style={styles.mandatoryLine}>{mandatoryText}</Text>}

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoMain}>{formatLongDate(event.startTime)}</Text>
              <Text style={styles.infoSub}>{formatTimeRange(event.startTime, event.endTime)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.accent} />
            <View style={styles.infoText}>
              <Text style={styles.infoMain}>{event.venue}</Text>
            </View>
          </View>

          {!!event.speakerName && (
            <View style={styles.infoRow}>
              <Ionicons name="mic-outline" size={20} color={colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoMain}>{event.speakerName}</Text>
                <Text style={styles.infoSub}>Speaker</Text>
              </View>
            </View>
          )}

          <Text style={styles.heading}>About Event</Text>
          <Text style={styles.paragraph}>{event.description || 'No description added.'}</Text>

          {hasSchedule && (
            <>
              <Text style={styles.heading}>Program Schedule</Text>
              {event.scheduleType === 'pdf' ? (
                <TouchableOpacity
                  style={styles.pdfRow}
                  onPress={() => openSchedule(event.scheduleContent)}
                >
                  <Ionicons name="document-text" size={24} color="#D32F2F" />
                  <Text style={styles.pdfText}>View Program Schedule (PDF)</Text>
                  <Ionicons name="open-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.paragraph}>{event.scheduleContent}</Text>
              )}
            </>
          )}

          <View style={styles.organizerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(event.organizerName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.infoMain}>{event.organizerName}</Text>
              <Text style={styles.infoSub}>Organizer</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={[styles.btn, styles.btnOutline, saved && styles.btnSaved]}
          onPress={onToggleSave}
        >
          <Text style={[styles.btnText, { color: colors.primary }]}>
            {saved ? 'Saved ✓' : 'Save to Calendar'}
          </Text>
        </TouchableOpacity>

        {showCheckIn && (
          <TouchableOpacity
            style={[styles.btn, attended ? styles.btnSaved : styles.btnFilled]}
            disabled={attended}
            onPress={() => navigation.navigate('Scanner', { eventId })}
          >
            <Text style={[styles.btnText, { color: attended ? colors.primary : '#fff' }]}>
              {attended ? 'Checked In ✓' : 'Check In (QR)'}
            </Text>
          </TouchableOpacity>
        )}

{isOwner && (
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => navigation.navigate('Attendance', { eventId })}
          >
            <Text style={[styles.btnText, { color: colors.primary }]}>Attendance</Text>
          </TouchableOpacity>
        )}
        {showQr && (
          <TouchableOpacity
            style={[styles.btn, styles.btnFilled]}
            onPress={() => navigation.navigate('ShowQR', { eventId })}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>Show QR Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  message: { color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  backBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10 },
  backText: { color: colors.primary, fontWeight: '700' },
  cover: { width: '100%', height: 230 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: {
    padding: spacing.md,
    marginTop: -20,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  tags: { flexDirection: 'row', gap: 8, marginTop: spacing.sm, marginBottom: spacing.sm },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  tagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  mandatoryLine: { color: colors.mandatoryText, fontSize: 13, fontWeight: '600', marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: spacing.md },
  infoText: { flex: 1 },
  infoMain: { fontSize: 14, fontWeight: '700', color: colors.text },
  infoSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  heading: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  paragraph: { fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 6 },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: 8,
  },
  pdfText: { flex: 1, color: colors.text, fontWeight: '600' },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  btnSaved: { backgroundColor: '#EFEBFF' },
  btnFilled: { backgroundColor: colors.primary },
  btnText: { fontSize: 14, fontWeight: '700' },
});