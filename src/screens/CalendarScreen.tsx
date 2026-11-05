import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useSavedIds } from '../hooks/useSavedIds';
import { toggleSaved } from '../services/saved';
import { EventItem } from '../types';
import { Palette, spacing, useTheme, useThemedStyles } from '../theme';
import { useAttendedIds } from '../hooks/useAttendedIds';

type Tab = 'Saved' | 'Attended';

// Local date as YYYY-MM-DD. toISOString() is not used because it shifts early-morning events to the previous day.
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CalendarScreen() {
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { events, loading, error } = useEvents();
  const savedIds = useSavedIds(profile?.uid);

  const isStudent = profile?.role === 'student';
  const [tab, setTab] = useState<Tab>('Saved');
  const [selected, setSelected] = useState<string | null>(null);

  // Saved events that still exist. Deleted originals are not in `events`, so they are skipped.
  const savedEvents = useMemo(
    () =>
      events
        .filter((e) => savedIds.has(e.eventId))
        .sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis()),
    [events, savedIds]
  );

  const attendedIds = useAttendedIds(profile?.uid);
  const attendedEvents = useMemo(
    () =>
      events
        .filter((e) => attendedIds.has(e.eventId))
        .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis()),
    [events, attendedIds]
  );

  const source = tab === 'Saved' ? savedEvents : attendedEvents;

  const marked = useMemo(() => {
    const result: Record<string, any> = {};
    source.forEach((e) => {
      result[dateKey(e.startTime.toDate())] = { marked: true, dotColor: colors.primary };
    });
    if (selected) {
      result[selected] = {
        ...(result[selected] ?? {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }
    return result;
  }, [source, selected, colors]);

  const shown = useMemo(
    () => (selected ? source.filter((e) => dateKey(e.startTime.toDate()) === selected) : source),
    [source, selected]
  );

  const onDayPress = (dateString: string) =>
    setSelected((cur) => (cur === dateString ? null : dateString));

  const onToggleSave = async (event: EventItem) => {
    if (!profile) return;
    try {
      await toggleSaved(profile.uid, event, savedIds.has(event.eventId));
    } catch {
      // The saved list updates live, so a failed toggle simply leaves things as they were.
    }
  };

  const emptyText = () => {
    if (loading) return '';
    if (selected) return 'No events on this date.';
    return tab === 'Saved'
      ? 'No saved events yet. Browse the Home feed to save some!'
      : 'No attended events yet. Scan a QR code at an event to record your attendance.';
  };

  const header = (
    <View>
      <Calendar
        // The key makes the calendar redraw when the theme changes.
        key={isDark ? 'dark' : 'light'}
        markedDates={marked}
        onDayPress={(d) => onDayPress(d.dateString)}
        firstDay={1}
        enableSwipeMonths
        theme={{
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textMuted,
          dayTextColor: colors.text,
          textDisabledColor: colors.placeholder,
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          dotColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#FFFFFF',
          monthTextColor: colors.text,
          textMonthFontWeight: '800',
        }}
      />
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          {selected ? `Events on ${selected}` : tab === 'Saved' ? 'All saved events' : 'All attended events'}
        </Text>
        {selected && (
          <TouchableOpacity onPress={() => setSelected(null)} hitSlop={10}>
            <Text style={styles.link}>Show all</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>My Calendar</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('Saved')}>
          <Text style={[styles.tabText, tab === 'Saved' && styles.tabTextActive]}>
            Saved ({savedEvents.length})
          </Text>
          {tab === 'Saved' && <View style={styles.tabLine} />}
        </TouchableOpacity>
        {isStudent && (
          <TouchableOpacity style={styles.tab} onPress={() => setTab('Attended')}>
            <Text style={[styles.tabText, tab === 'Attended' && styles.tabTextActive]}>
              Attended ({attendedEvents.length})
            </Text>
            {tab === 'Attended' && <View style={styles.tabLine} />}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <Text style={styles.empty}>{error}</Text>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(e) => e.eventId}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
              <Text style={styles.empty}>{emptyText()}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              saved={savedIds.has(item.eventId)}
              onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
              onToggleSave={() => onToggleSave(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    titleRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.md },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    tabText: { fontSize: 14, color: colors.textMuted },
    tabTextActive: { color: colors.primary, fontWeight: '700' },
    tabLine: { height: 2, width: 48, backgroundColor: colors.primary, marginTop: 6 },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
    link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    emptyBox: { alignItems: 'center', marginTop: 24, gap: 8 },
    empty: { color: colors.textMuted, textAlign: 'center' },
  });