import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, radius, spacing, useColors, useThemedStyles } from '../theme';

type Props = TextInputProps & {
  label: string;
  secure?: boolean; // password field with a show/hide eye
  error?: string;
};

export default function AuthInput({ label, secure, error, ...rest }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          secureTextEntry={hidden}
          {...rest}
        />
        {secure && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
    },
    boxError: { borderColor: colors.error },
    input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
    error: { color: colors.error, fontSize: 12, marginTop: 4 },
  });