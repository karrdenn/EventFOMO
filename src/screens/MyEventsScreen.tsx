import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { EventItem } from '../types';
import { formatLongDate } from '../utils/dates';
import { colors, radius, spacing } from '../theme';

type Tab = 'All' | 'Upcoming' | 'Past';
const TABS: Tab[] = ['All', 'Upcoming', 'Past'];

export default function MyEventsScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('All');

  // Live list of the events created by this user.
  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'events'), where('organizerId', '==', profile.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setEvents(snap.docs.map((d) => ({ ...(d.data() as EventItem), eventId: d.id })));
        setError('');
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [profile?.uid]);

  const shown = useMemo(() => {
    const now = Date.now();
    const isUpcoming = (e: EventItem) => e.endTime.toMillis() >= now;
    if (tab === 'Upcoming') {
      return events
        .filter(isUpcoming)
        .sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
    }
    const list = tab === 'Past' ? events.filter((e) => !isUpcoming(e)) : [...events];
    return list.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
  }, [events, tab]);

  const confirmDelete = (event: EventItem) => {
    Alert.alert('Delete event', `Delete "${event.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'events', event.eventId));
          } catch (e) {
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: EventItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
    >
      {item.coverImageUrl ? (
        <Image source={{ uri: item.coverImageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.date} numberOfLines={1}>
          {formatLongDate(item.startTime)}
        </Text>
      </View>
      <TouchableOpacity
        hitSlop={10}
        onPress={() => navigation.navigate('EditEvent', { eventId: item.eventId })}
      >
        <Ionicons name="pencil" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity hitSlop={10} onPress={() => confirmDelete(item)}>
        <Ionicons name="trash" size={20} color="#D32F2F" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Events</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            {tab === t && <View style={styles.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(e) => e.eventId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, gap: 12 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === 'All' ? 'You have not created any events yet.' : `No ${tab.toLowerCase()} events.`}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabText: { fontSize: 14, color: '#757575' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  tabLine: { height: 2, width: 36, backgroundColor: colors.primary, marginTop: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E7E9F2',
  },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbEmpty: { backgroundColor: '#EFEBFF', alignItems: 'center', justifyContent: 'center' },
  category: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  date: { fontSize: 12, color: '#757575', marginTop: 2 },
  empty: { textAlign: 'center', color: '#757575', marginTop: 40 },
  error: { color: colors.mandatoryText, padding: spacing.md },
});