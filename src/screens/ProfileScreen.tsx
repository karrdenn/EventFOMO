import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useSavedIds } from '../hooks/useSavedIds';
import { UserProfile } from '../types';
import { colors, radius, spacing } from '../theme';
import { useAttendedIds } from '../hooks/useAttendedIds';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ProfileScreen() {
  const { profile: authProfile, logOut } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { events } = useEvents();
  const savedIds = useSavedIds(authProfile?.uid);

  // A live copy of the profile, so edits show up straight away.
  const [live, setLive] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (!authProfile?.uid) return;
    return onSnapshot(doc(db, 'users', authProfile.uid), (snap) => {
      if (snap.exists()) setLive(snap.data() as UserProfile);
    });
  }, [authProfile?.uid]);

  const profile = live ?? authProfile;
  const isStudent = profile?.role === 'student';

  // Saved events whose original was deleted are not counted.
  const savedCount = useMemo(
    () => events.filter((e) => savedIds.has(e.eventId)).length,
    [events, savedIds]
  );
  
  const attendedIds = useAttendedIds(authProfile?.uid);
  const attendedCount = useMemo(
    () => events.filter((e) => attendedIds.has(e.eventId)).length,
    [events, attendedIds]
  );

  const confirmLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const showHelp = () =>
    Alert.alert(
      'Help & Support',
      'Browse events on Home, tap the bookmark to save them, and use the Calendar tab to see your saved events.\n\nProblems? Contact your Computing Technologies Department or the event organizer.'
    );

  const Row = ({
    icon,
    label,
    onPress,
    color = colors.primary,
    textColor = colors.text,
  }: {
    icon: IconName;
    label: string;
    onPress: () => void;
    color?: string;
    textColor?: string;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.rowText, { color: textColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.top}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.avatarText}>
                  {(profile?.fullName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile?.fullName}</Text>
          <Text style={styles.line}>
            ID: {profile?.studentId} • {profile?.role === 'staff' ? 'Staff' : 'Student'}
          </Text>
          <Text style={styles.line}>{profile?.email}</Text>
          {isStudent && (
            <Text style={styles.line}>
              {profile?.year || 'Year not set'} • Club: {profile?.club || 'None'}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          {isStudent && (
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{attendedCount}</Text>
              <Text style={styles.statLabel}>Attended</Text>
            </View>
          )}
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <Row icon="create-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <Row icon="calendar-outline" label="My Events" onPress={() => navigation.navigate('MyEvents')} />
          <Row
            icon="notifications-outline"
            label="Notification Preferences"
            onPress={() => navigation.navigate('NotificationPrefs')}
          />
          <Row icon="help-circle-outline" label="Help & Support" onPress={showHelp} />
          <Row
            icon="log-out-outline"
            label="Log Out"
            onPress={confirmLogOut}
            color="#D32F2F"
            textColor="#D32F2F"
          />
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, padding: spacing.md },
  top: { alignItems: 'center', paddingHorizontal: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarEmpty: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 12 },
  line: { color: colors.textMuted, marginTop: 3, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.md, marginTop: spacing.md },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  menu: { marginTop: spacing.md, paddingHorizontal: spacing.md, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.lg },
});