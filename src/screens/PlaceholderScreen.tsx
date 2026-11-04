import { StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors } from '../theme';

// One simple screen reused for every route until we build the real ones.
export default function PlaceholderScreen() {
  const route = useRoute();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{route.name}</Text>
      <Text style={styles.subtitle}>Placeholder screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary },
  subtitle: { marginTop: 8, color: colors.textMuted },
});