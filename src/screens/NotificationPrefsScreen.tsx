import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PREFS, UserPrefs } from '../types';
import { colors, radius, spacing } from '../theme';

const LEADS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '1 day', value: 1440 },
];

type SwitchKey = 'newEvents' | 'reminders' | 'mandatory' | 'updates';
const OPTIONS: { key: SwitchKey; label: string }[] = [
  { key: 'newEvents', label: 'New Events' },
  { key: 'reminders', label: 'Event Reminders' },
  { key: 'mandatory', label: 'Mandatory Alerts' },
  { key: 'updates', label: 'Event Updates' },
];

export default function NotificationPrefsScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [prefs, setPrefs] = useState<UserPrefs>({ ...DEFAULT_PREFS, ...(profile?.prefs ?? {}) });

  useEffect(() => {
    if (!profile?.uid) return;
    return onSnapshot(doc(db, 'users', profile.uid), (snap) => {
      const data = snap.data();
      if (data) setPrefs({ ...DEFAULT_PREFS, ...(data.prefs ?? {}) });
    });
  }, [profile?.uid]);

  // Show the change straight away, then save it.
  const change = (patch: Partial<UserPrefs>) => {
    if (!profile) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    updateDoc(doc(db, 'users', profile.uid), { prefs: next }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.mainLabel}>Allow Notifications</Text>
            <Switch
              value={prefs.allow}
              onValueChange={(v) => change({ allow: v })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          {OPTIONS.map((o) => (
            <View key={o.key} style={[styles.row, styles.rowBorder]}>
              <Text style={[styles.label, !prefs.allow && styles.dim]}>{o.label}</Text>
              <Switch
                value={prefs[o.key]}
                disabled={!prefs.allow}
                onValueChange={(v) => change({ [o.key]: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>
          ))}
        </View>

        <Text style={styles.heading}>Remind me before an event</Text>
        <View style={styles.chips}>
          {LEADS.map((l) => (
            <TouchableOpacity
              key={l.value}
              style={[styles.chip, prefs.leadMinutes === l.value && styles.chipActive]}
              onPress={() => change({ leadMinutes: l.value })}
            >
              <Text style={[styles.chipText, prefs.leadMinutes === l.value && styles.chipTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>
          Manage how you want to be notified about campus life. You can change these settings at any time.
          Reminders before events and alerts on the lock screen are added in a later step.
        </Text>
      </ScrollView>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  mainLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  label: { fontSize: 14, color: colors.text },
  dim: { color: colors.textMuted },
  heading: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: spacing.lg, marginBottom: 10 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D9DCE8',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  note: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
});