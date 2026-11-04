import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthInput from '../../components/AuthInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { friendlyAuthError } from '../../utils/authErrors';
import { AuthStackParamList } from '../../navigation/types';
import { CLUBS, Role, YEARS } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { authStyles as s } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [role, setRole] = useState<Role>('student');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [year, setYear] = useState('');
  const [club, setClub] = useState('None');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): string => {
    if (!fullName.trim()) return 'Enter your full name.';
    if (!studentId.trim()) return `Enter your ${role === 'student' ? 'Student' : 'Staff'} ID.`;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.';
    if (role === 'student' && !year) return 'Choose your year.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return '';
  };

  const onCreate = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp({ fullName, studentId, email, password, role, year, club });
      // On success the app switches to the main tabs automatically.
    } catch (e) {
      setError(friendlyAuthError(e));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join the College of Science and Technology Community</Text>

          {error ? <Text style={s.errorBanner}>{error}</Text> : null}

          {/* Student / Staff toggle */}
          <View style={styles.toggle}>
            {(['student', 'staff'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.toggleBtn, role === r && styles.toggleActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.toggleText, role === r && styles.toggleTextActive]}>
                  {r === 'student' ? 'Student' : 'Staff'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <AuthInput
            label="Full Name"
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <AuthInput
            label="Student / Staff ID"
            placeholder="e.g. 02240157"
            value={studentId}
            onChangeText={setStudentId}
          />
          <AuthInput
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          {role === 'student' && (
            <>
              <Text style={styles.label}>Year</Text>
              <View style={styles.chips}>
                {YEARS.map((y) => (
                  <Chip key={y} label={y} active={year === y} onPress={() => setYear(y)} />
                ))}
              </View>

              <Text style={styles.label}>Club</Text>
              <View style={styles.chips}>
                {CLUBS.map((c) => (
                  <Chip key={c} label={c} active={club === c} onPress={() => setClub(c)} />
                ))}
              </View>
            </>
          )}

          <AuthInput label="Password" value={password} onChangeText={setPassword} secure />
          <AuthInput label="Confirm Password" value={confirm} onChangeText={setConfirm} secure />

          <PrimaryButton title="CREATE ACCOUNT" onPress={onCreate} loading={loading} />

          <View style={s.linkRow}>
            <Text style={s.muted}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.link}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E8EAF6',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { color: colors.textMuted, fontWeight: '600' },
  toggleTextActive: { color: colors.primary },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D9DCE8',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});