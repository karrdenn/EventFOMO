import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function ProfileScreen() {
  const { profile, logOut } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const confirmLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.name}>{profile?.fullName}</Text>
        <Text style={styles.line}>ID: {profile?.studentId} • {profile?.role}</Text>
        <Text style={styles.line}>{profile?.email}</Text>
        {profile?.role === 'student' && (
          <Text style={styles.line}>
            {profile.year} • Club: {profile.club}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('MyEvents')}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={styles.menuText}>My Events</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={{ padding: spacing.lg }}>
        <PrimaryButton title="LOG OUT" onPress={confirmLogOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  card: { margin: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 16 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
  line: { color: colors.textMuted, marginTop: 2 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
});