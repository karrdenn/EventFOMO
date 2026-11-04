import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import EventForm, { EventFormData } from '../components/EventForm';
import { notifyNewEvent } from '../services/notifications';
import { colors, spacing } from '../theme';

export default function CreateEventScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  // Changing this number gives the form a fresh start after publishing.
  const [formKey, setFormKey] = useState(0);

  const onSubmit = async (data: EventFormData) => {
    if (!profile) throw new Error('You need to be logged in.');
    const ref = doc(collection(db, 'events'));
    await setDoc(ref, {
      eventId: ref.id,
      ...data,
      organizerId: profile.uid,
      createdAt: serverTimestamp(),
    });

    // A failure here must not stop the event from being published.
    try {
      await notifyNewEvent(ref.id, data, profile.uid);
    } catch (e) {
      console.warn('Could not send alerts', e);
    }

    setFormKey((k) => k + 1);
    navigation.navigate('EventDetails', { eventId: ref.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Event</Text>
      </View>
      <EventForm key={formKey} submitLabel="PUBLISH EVENT" onSubmit={onSubmit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
});