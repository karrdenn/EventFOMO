import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { markAllRead, markRead } from '../services/notifications';
import { NotificationItem } from '../types';
import { formatLongDate } from '../utils/dates';
import { colors, radius, spacing } from '../theme';

export default function AlertsScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { items, loading, error } = useNotifications(profile?.uid);
  const unreadCount = items.filter((n) => !n.isRead).length;

  const open = (n: NotificationItem) => {
    if (!n.isRead) markRead(n.id).catch(() => {});
    navigation.navigate('EventDetails', { eventId: n.eventId });
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const mandatory = item.type === 'mandatory';
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        activeOpacity={0.85}
        onPress={() => open(item)}
      >
        <View style={[styles.iconBox, { backgroundColor: mandatory ? colors.mandatoryBg : '#EFEBFF' }]}>
          <Ionicons
            name={mandatory ? 'alert-circle' : 'calendar'}
            size={22}
            color={mandatory ? colors.mandatoryText : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, !item.isRead && styles.bold]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{item.createdAt ? formatLongDate(item.createdAt) : 'Just now'}</Text>
        </View>
        {!item.isRead && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead(items).catch(() => {})} hitSlop={10}>
            <Text style={styles.link}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <Text style={styles.empty}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, gap: 10 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-outline" size={44} color={colors.textMuted} />
              <Text style={styles.empty}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardUnread: { backgroundColor: '#F3F0FF', borderColor: colors.primary },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, color: colors.text },
  bold: { fontWeight: '800' },
  body: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 8 },
  empty: { color: colors.textMuted, textAlign: 'center' },
});