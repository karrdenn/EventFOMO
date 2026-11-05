import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useSavedIds } from '../hooks/useSavedIds';
import { useAttendedIds } from '../hooks/useAttendedIds';
import { toggleSaved } from '../services/saved';
import { RankedEvent, rankForYou } from '../utils/forYou';
import { CATEGORIES, EventItem } from '../types';
import { colors, radius, spacing } from '../theme';

const FILTERS = ['All', ...CATEGORIES];

type Mode = 'For You' | 'All';
const MODES: Mode[] = ['For You', 'All'];

export default function HomeScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { events, loading, error } = useEvents();
  const savedIds = useSavedIds(profile?.uid);
  const attendedIds = useAttendedIds(profile?.uid);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState<Mode>('For You');

  const isStudent = profile?.role === 'student';
  const forYouOn = isStudent && mode === 'For You';
  const year = profile?.year ?? '';
  const club = profile?.club ?? '';

  // Keep only upcoming events, apply the filters, then order them.
  const visible: RankedEvent[] = useMemo(() => {
    const now = Date.now();
    const text = search.trim().toLowerCase();
    const filtered = events
      .filter((e) => (e.endTime?.toMillis() ?? 0) >= now)
      .filter((e) => category === 'All' || e.category === category)
      .filter((e) => !text || e.title.toLowerCase().includes(text));

    if (forYouOn) return rankForYou(filtered, year, club, attendedIds);
    return filtered.map((event) => ({ event, reason: 'other' as const }));
  }, [events, search, category, forYouOn, year, club, attendedIds]);

  const filtering = search.trim() !== '' || category !== 'All';
  const firstName = profile?.fullName.split(' ')[0] ?? '';

  const onToggleSave = async (event: EventItem) => {
    if (!profile) return;
    try {
      await toggleSaved(profile.uid, event, savedIds.has(event.eventId));
    } catch {
      Alert.alert('Could not update', 'Check your internet connection and try again.');
    }
  };

  const renderEmpty = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
    }
    if (error) {
      return <Text style={styles.emptyText}>{error}</Text>;
    }
    return (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>
          {filtering ? 'No events match your search.' : 'No upcoming events yet.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.small}>Kuzuzangpo la,</Text>
          <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} hitSlop={10}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isStudent && (
        <View style={styles.toggle}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, shows..."
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, category === f && styles.chipActive]}
              onPress={() => setCategory(f)}
            >
              <Text style={[styles.chipText, category === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.event.eventId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.sectionTitle}>{forYouOn ? 'For You' : 'Upcoming Events'}</Text>
            {forYouOn && (
              <Text style={styles.sectionSub}>Sorted by your year and club.</Text>
            )}
          </View>
        }
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <View>
            {forYouOn && item.reason === 'mandatory' && (
              <View style={styles.reasonRow}>
                <Ionicons name="alert-circle" size={14} color={colors.mandatoryText} />
                <Text style={[styles.reasonText, { color: colors.mandatoryText }]}>
                  Required for you
                </Text>
              </View>
            )}
            {forYouOn && item.reason === 'club' && (
              <View style={styles.reasonRow}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={[styles.reasonText, { color: colors.primary }]}>
                  From your club ({club})
                </Text>
              </View>
            )}
            <EventCard
              event={item.event}
              saved={savedIds.has(item.event.eventId)}
              onPress={() =>
                navigation.navigate('EventDetails', { eventId: item.event.eventId })
              }
              onToggleSave={() => onToggleSave(item.event)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  small: { fontSize: 12, color: colors.textMuted },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E8EAF6',
    borderRadius: radius.md,
    padding: 4,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.sm },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: colors.primary, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: colors.text },
  chips: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#E8EAF6',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6, marginLeft: 4 },
  reasonText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});