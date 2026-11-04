import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({ title, onPress, loading, disabled }: Props) {
  const off = loading || disabled;
  return (
    <TouchableOpacity
      style={[styles.button, off && styles.off]}
      onPress={onPress}
      disabled={off}
      activeOpacity={0.8}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.6 },
  text: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});