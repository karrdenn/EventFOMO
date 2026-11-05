import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { HistoryItem, HistoryStatus, useAttendanceHistory } from '../hooks/useAttendanceHistory';
import { formatLongDate } from '../utils/dates';
import { Palette, radius, spacing, useColors, useThemedStyles } from '../theme';

type Filter = 'All' | HistoryStatus;
const FILTERS: Filter[] = ['All', 'Attended', 'Missed', 'Upcoming'];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const statusStyle = (
  colors: Palette
): Record<HistoryStatus, { bg: string; fg: string; icon: IconName }> => ({
  Attended: { bg: colors.successBg, fg: colors.successText, icon: 'checkmark-circle' },
  Missed: { bg: colors.mandatoryBg, fg: colors.mandatoryText, icon: 'close-circle' },
  Upcoming: { bg: colors.tint, fg: colors.primary, icon: 'time' },
});

export default function AttendanceHistoryScreen() {
  const { profile } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { items, counts, completed, loading, error } = useAttendanceHistory(profile);
  const [filter, setFilter] = useState<Filter>('All');

  if (profile?.role !== 'student') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Attendance history is only for student accounts.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const STATUS = statusStyle(colors);
  const shown = filter === 'All' ? items : items.filter((i) => i.status === filter);
  const countFor = (f: Filter) =>
    f === 'All'
      ? items.length
      : f === 'Attended'
        ? counts.attended
        : f === 'Missed'
          ? counts.missed
          : counts.upcoming;

  const percent = completed === 0 ? 0 : Math.round((counts.attended / completed) * 100);

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const s = STATUS[item.status];
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('EventDetails', { eventId: item.event.eventId })}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.event.title}
          </Text>
          <Text style={styles.eventMeta}>{formatLongDate(item.event.startTime)}</Text>
          <Text style={styles.eventMeta} numberOfLines={1}>
            {item.event.venue}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Ionicons name={s.icon} size={14} color={s.fg} />
          <Text style={[styles.badgeText, { color: s.fg }]}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <Text style={styles.headline}>
          {completed === 0
            ? 'No mandatory events yet'
            : `Attended ${counts.attended} of ${completed} mandatory events`}
        </Text>
        <View style={{ marginTop: 12 }}>
          <ProgressBar value={completed === 0 ? 0 : counts.attended / completed} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.percent}>{completed === 0 ? '' : `${percent}% attendance`}</Text>
          <Text style={styles.sub}>{counts.upcoming} upcoming</Text>
        </View>
        <Text style={styles.note}>Based on your current year and club.</Text>
      </View>

      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={styles.tab} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f} ({countFor(f)})
            </Text>
            {filter === f && <View style={styles.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={shown}
        keyExtractor={(i) => i.event.eventId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md, gap: 10 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filter === 'All'
              ? 'No mandatory events apply to you yet.'
              : `No ${filter.toLowerCase()} events.`}
          </Text>
        }
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    message: { color: colors.textMuted, textAlign: 'center' },
    summary: {
      backgroundColor: colors.surface,
      margin: spacing.md,
      marginBottom: 0,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    headline: { fontSize: 18, fontWeight: '800', color: colors.text },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    percent: { fontSize: 12, fontWeight: '700', color: colors.primary },
    sub: { fontSize: 12, color: colors.textMuted },
    note: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.sm, marginTop: spacing.sm },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    tabText: { fontSize: 12, color: colors.textMuted },
    tabTextActive: { color: colors.primary, fontWeight: '700' },
    tabLine: { height: 2, width: 30, backgroundColor: colors.primary, marginTop: 6 },
    error: { color: colors.mandatoryText, paddingHorizontal: spacing.md },
    empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    eventTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    eventMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    badgeText: { fontSize: 12, fontWeight: '700' },
  });