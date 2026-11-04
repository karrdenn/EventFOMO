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
import { toggleSaved } from '../services/saved';
import { seedSampleEvents } from '../services/seedEvents';
import { CATEGORIES, EventItem } from '../types';
import { colors, radius, spacing } from '../theme';

const FILTERS = ['All', ...CATEGORIES];

export default function HomeScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { events, loading, error } = useEvents();
  const savedIds = useSavedIds(profile?.uid);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [seeding, setSeeding] = useState(false);

  // Keep only upcoming events, then apply the category filter and the search text.
  const visible = useMemo(() => {
    const now = Date.now();
    const text = search.trim().toLowerCase();
    return events
      .filter((e) => (e.endTime?.toMillis() ?? 0) >= now)
      .filter((e) => category === 'All' || e.category === category)
      .filter((e) => !text || e.title.toLowerCase().includes(text));
  }, [events, search, category]);

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

  const onSeed = async () => {
    if (!profile) return;
    setSeeding(true);
    try {
      await seedSampleEvents(profile.uid, profile.fullName);
    } catch {
      Alert.alert('Could not add sample events', 'Check your internet connection and your rules.');
    } finally {
      setSeeding(false);
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
        {__DEV__ && !filtering && (
          <TouchableOpacity style={styles.seedBtn} onPress={onSeed} disabled={seeding}>
            {seeding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.seedText}>Add sample events (testing only)</Text>
            )}
          </TouchableOpacity>
        )}
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
        keyExtractor={(item) => item.eventId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Upcoming Events</Text>}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            saved={savedIds.has(item.eventId)}
            onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
            onToggleSave={() => onToggleSave(item)}
          />
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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  empty: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  seedBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: 8,
  },
  seedText: { color: '#fff', fontWeight: '700' },
});