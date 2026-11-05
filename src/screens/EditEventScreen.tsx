import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { describeChanges, notifyEventUpdated } from '../services/notify';
import { useAuth } from '../context/AuthContext';
import EventForm, { EventFormData } from '../components/EventForm';
import { EventItem } from '../types';
import { colors, spacing } from '../theme';

export default function EditEventScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute();
  const { profile } = useAuth();
  const eventId = (route.params as { eventId?: string } | undefined)?.eventId;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!eventId) {
        setError('No event was selected.');
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'events', eventId));
        if (!snap.exists()) {
          setError('This event no longer exists.');
        } else {
          setEvent({ ...(snap.data() as EventItem), eventId: snap.id });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the event.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const onSubmit = async (data: EventFormData) => {
    if (!eventId || !event) throw new Error('No event was selected.');
    await updateDoc(doc(db, 'events', eventId), { ...data, updatedAt: serverTimestamp() });

    // Tell people only when something important changed. A failure here does not undo the save.
    const changes = describeChanges(event, data);
    if (profile && changes.length > 0) {
      notifyEventUpdated(
        {
          eventId,
          title: data.title,
          category: data.category,
          isMandatory: data.isMandatory,
          mandatoryFor: data.mandatoryFor,
          startTime: data.startTime,
        },
        profile.uid,
        changes
      ).catch(() => {});
    }

    Alert.alert('Saved', 'Your changes have been saved.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Event</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error || !event ? (
        <Text style={styles.error}>{error || 'Could not load the event.'}</Text>
      ) : (
        <EventForm existing={event} submitLabel="SAVE CHANGES" onSubmit={onSubmit} />
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
  error: { color: colors.mandatoryText, padding: spacing.md },
});