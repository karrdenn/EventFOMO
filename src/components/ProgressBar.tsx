import { StyleSheet, View } from 'react-native';
import { Palette, useThemedStyles } from '../theme';

// value goes from 0 (empty) to 1 (full).
export default function ProgressBar({ value }: { value: number }) {
  const styles = useThemedStyles(makeStyles);
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` as `${number}%` }]} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    track: { height: 8, borderRadius: 4, backgroundColor: colors.chip, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  });