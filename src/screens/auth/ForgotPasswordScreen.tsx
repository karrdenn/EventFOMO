import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthInput from '../../components/AuthInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { friendlyAuthError } from '../../utils/authErrors';
import { AuthStackParamList } from '../../navigation/types';
import { useThemedStyles } from '../../theme';
import { makeAuthStyles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword } = useAuth();
  const s = useThemedStyles(makeAuthStyles);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSend = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setSent(false);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.title}>Reset Password</Text>
        <Text style={s.subtitle}>
          Enter your email and we'll send you a link to set a new password.
        </Text>

        {error ? <Text style={s.errorBanner}>{error}</Text> : null}
        {sent ? (
          <Text style={s.successBanner}>Reset link sent. Check your inbox (and spam folder).</Text>
        ) : null}

        <AuthInput
          label="Email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />

        <PrimaryButton title="SEND RESET LINK" onPress={onSend} loading={loading} />

        <View style={s.linkRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.link}>Back to Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}