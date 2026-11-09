import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, ThemeMode, radius, spacing, useTheme, useThemedStyles } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const OPTIONS: { value: ThemeMode; label: string; hint: string; icon: IconName }[] = [
  { value: 'system', label: 'System', hint: "Match your phone's setting", icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', hint: 'Always use the light theme', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', hint: 'Always use the dark theme', icon: 'moon-outline' },
];

export default function AppearanceScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { colors, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Appearance</Text>
      </View>

      <View style={styles.card}>
        {OPTIONS.map((o, i) => {
          const active = mode === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => setMode(o.value)}
              activeOpacity={0.8}
            >
              <Ionicons name={o.icon} size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{o.label}</Text>
                <Text style={styles.hint}>{o.hint}</Text>
              </View>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={active ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.note}>
        System follows your phone's light or dark setting. Your choice is remembered the next time you open the app.
      </Text>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
    label: { fontSize: 15, fontWeight: '700', color: colors.text },
    hint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    note: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      lineHeight: 18,
    },
  });