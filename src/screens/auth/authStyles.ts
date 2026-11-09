import { StyleSheet } from 'react-native';
import { Palette, radius, spacing } from '../../theme';

// Styles shared by the Login, SignUp and ForgotPassword screens.
// Use them in a screen with: const s = useThemedStyles(makeAuthStyles);
export const makeAuthStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
    brand: { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center' },
    brandAccent: { color: colors.primary },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
    errorBanner: {
      backgroundColor: colors.mandatoryBg,
      color: colors.mandatoryText,
      padding: spacing.sm + 4,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
      fontSize: 13,
    },
    successBanner: {
      backgroundColor: colors.successBg,
      color: colors.successText,
      padding: spacing.sm + 4,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
      fontSize: 13,
    },
    linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
    muted: { color: colors.textMuted, fontSize: 13 },
    link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  });