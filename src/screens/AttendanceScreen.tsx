import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../hooks/useEvent';
import { shareCsv } from '../services/exportCsv';
import { CheckinItem, UserProfile } from '../types';
import { colors, radius, spacing } from '../theme';

type AttendanceRoute = RouteProp<{ Attendance: { eventId: string } }, 'Attendance'>;
type Filter = 'Attended' | 'Absent';

const timeText = (item: CheckinItem) =>
  item.checkedInAt
    ? item.checkedInAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

export default function AttendanceScreen() {
  const { eventId } = useRoute<AttendanceRoute>().params;
  const { profile } = useAuth();
  const { event, loading } = useEvent(eventId);

  const [checkins, setCheckins] = useState<CheckinItem[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<Filter>('Attended');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const isOwner = !!event && !!profile && event.organizerId === profile.uid;

  // Live list of check-ins for this event.
  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'checkins'),
      where('eventId', '==', eventId),
      where('organizerId', '==', profile.uid)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as Omit<CheckinItem, 'id'>), id: d.id }));
        const time = (c: CheckinItem) => c.checkedInAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
        list.sort((a, b) => time(a) - time(b));
        setCheckins(list);
      },
      (err) => setError(err.message)
    );
  }, [eventId, profile?.uid]);

  // All students, needed to work out who is absent.
  useEffect(() => {
    if (!isOwner || !event?.isMandatory) return;
    getDocs(query(collection(db, 'users'), where('role', '==', 'student')))
      .then((snap) => setStudents(snap.docs.map((d) => d.data() as UserProfile)))
      .catch((e) => setError(e.message));
  }, [isOwner, event?.isMandatory]);

  const attendedIds = useMemo(() => new Set(checkins.map((c) => c.userId)), [checkins]);

  // Students who must attend but have not checked in.
  const absent = useMemo(() => {
    if (!event?.isMandatory) return [];
    const groups = event.mandatoryFor ?? [];
    return students
      .filter((s) => {
        if (attendedIds.has(s.uid)) return false;
        if (groups.length === 0) return true; // mandatory for everyone
        return groups.includes(s.year) || (!!s.club && s.club !== 'None' && groups.includes(s.club));
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [students, attendedIds, event]);

  const exportCsv = async () => {
    if (!event) return;
    setExporting(true);
    try {
      const rows: (string | number)[][] = [
        ...checkins.map((c) => [
          c.studentName,
          c.studentId,
          c.year,
          c.club,
          'Attended',
          c.checkedInAt ? c.checkedInAt.toDate().toLocaleString() : '',
        ]),
        ...absent.map((s) => [s.fullName, s.studentId, s.year, s.club, 'Absent', '']),
      ];
      await shareCsv(`${event.title}_attendance`, ['Name', 'Student ID', 'Year', 'Club', 'Status', 'Checked in at'], rows);
    } catch (e) {
      Alert.alert('Could not export', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

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
        <Text style={styles.message}>Only the organizer of this event can see its attendance.</Text>
      </View>
    );
  }

  const showAbsentTab = event.isMandatory;
  const listData: { key: string; name: string; sub: string; right: string }[] =
    filter === 'Attended'
      ? checkins.map((c) => ({
          key: c.id,
          name: c.studentName,
          sub: `${c.studentId} • ${c.year || 'No year'}${c.club && c.club !== 'None' ? ` • ${c.club}` : ''}`,
          right: timeText(c),
        }))
      : absent.map((s) => ({
          key: s.uid,
          name: s.fullName,
          sub: `${s.studentId} • ${s.year || 'No year'}${s.club && s.club !== 'None' ? ` • ${s.club}` : ''}`,
          right: '',
        }));

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{checkins.length}</Text>
            <Text style={styles.statLabel}>Checked in</Text>
          </View>
          {showAbsentTab && (
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.mandatoryText }]}>{absent.length}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          )}
        </View>
        {showAbsentTab && (
          <Text style={styles.groups}>
            Mandatory for: {(event.mandatoryFor ?? []).length ? event.mandatoryFor.join(', ') : 'everyone'}
          </Text>
        )}
      </View>

      <View style={styles.tabs}>
        {(showAbsentTab ? (['Attended', 'Absent'] as Filter[]) : (['Attended'] as Filter[])).map((f) => (
          <TouchableOpacity key={f} style={styles.tab} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f} ({f === 'Attended' ? checkins.length : absent.length})
            </Text>
            {filter === f && <View style={styles.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={listData}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: spacing.md, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filter === 'Attended' ? 'No one has checked in yet.' : 'Everyone required has checked in.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.sub}</Text>
            </View>
            {!!item.right && <Text style={styles.time}>{item.right}</Text>}
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportBtn} onPress={exportCsv} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.exportText}>EXPORT CSV</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  message: { color: colors.textMuted, textAlign: 'center' },
  summary: { padding: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  groups: { color: colors.mandatoryText, fontSize: 12, fontWeight: '600', marginTop: 10 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabText: { fontSize: 14, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  tabLine: { height: 2, width: 60, backgroundColor: colors.primary, marginTop: 6 },
  error: { color: colors.mandatoryText, paddingHorizontal: spacing.md, marginTop: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  exportBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
});