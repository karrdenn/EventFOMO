import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';
import { useAuth } from '../context/AuthContext';
import { useAttendanceHistory } from '../hooks/useAttendanceHistory';
import { colors, radius, spacing } from '../theme';

export default function ComplianceCard() {
  const { profile } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { counts, completed, loading } = useAttendanceHistory(profile);

  // Only students have an attendance history.
  if (profile?.role !== 'student') return null;

  let headline = 'Loading...';
  if (!loading) {
    headline =
      completed === 0
        ? 'No mandatory events yet'
        : `Attended ${counts.attended} of ${completed} mandatory events`;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('AttendanceHistory')}
    >
      <View style={styles.top}>
        <Text style={styles.title}>Attendance</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      <Text style={styles.headline}>{headline}</Text>
      <View style={{ marginTop: 10 }}>
        <ProgressBar value={completed === 0 ? 0 : counts.attended / completed} />
      </View>
      {!loading && counts.upcoming > 0 && (
        <Text style={styles.sub}>
          {counts.upcoming} upcoming mandatory {counts.upcoming === 1 ? 'event' : 'events'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  headline: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 6 },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
});