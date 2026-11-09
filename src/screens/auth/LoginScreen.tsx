import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthInput from '../../components/AuthInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { friendlyAuthError } from '../../utils/authErrors';
import { AuthStackParamList } from '../../navigation/types';
import { useThemedStyles } from '../../theme';
import { makeAuthStyles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const s = useThemedStyles(makeAuthStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // On success the app switches to the main tabs automatically.
    } catch (e) {
      setError(friendlyAuthError(e));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.brand}>
            Event<Text style={s.brandAccent}>FOMO</Text>
          </Text>
          <Text style={[s.subtitle, { textAlign: 'center' }]}>NEVER MISS A CAMPUS EVENT</Text>

          {error ? <Text style={s.errorBanner}>{error}</Text> : null}

          <AuthInput
            label="Student / Staff Email"
            placeholder="Student / Staff Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <AuthInput
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secure
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={{ alignSelf: 'flex-end', marginBottom: 16 }}
          >
            <Text style={s.link}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton title="LOG IN" onPress={onLogin} loading={loading} />

          <View style={s.linkRow}>
            <Text style={s.muted}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}