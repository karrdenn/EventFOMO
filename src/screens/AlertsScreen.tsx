import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
  import { Ionicons } from '@expo/vector-icons';
  import { deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
  import { db } from '../services/firebase';
  import { useAuth } from '../context/AuthContext';
  import { useNotifications } from '../hooks/useNotifications';
  import { NotificationItem, NotificationType } from '../types';
  import { timeAgo } from '../utils/timeAgo';
  import { Palette, radius, spacing, useColors, useThemedStyles } from '../theme';
  
  type IconName = React.ComponentProps<typeof Ionicons>['name'];
  
  const metaFor = (colors: Palette): Record<NotificationType, { icon: IconName; color: string }> => ({
    new_event: { icon: 'calendar', color: colors.primary },
    mandatory: { icon: 'alert-circle', color: colors.mandatoryText },
    reminder: { icon: 'alarm', color: colors.category.Workshop },
    update: { icon: 'create', color: colors.category.Technical },
  });
  
  export default function AlertsScreen() {
    const { profile } = useAuth();
    const colors = useColors();
    const styles = useThemedStyles(makeStyles);
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const { items, unread, loading, error } = useNotifications(profile?.uid);
    const META = metaFor(colors);
  
    const open = (n: NotificationItem) => {
      if (!n.isRead) {
        updateDoc(doc(db, 'notifications', n.id), { isRead: true }).catch(() => {});
      }
      if (n.relatedEventId) {
        navigation.navigate('EventDetails', { eventId: n.relatedEventId });
      }
    };
  
    const markAllRead = async () => {
      const unreadItems = items.filter((i) => !i.isRead);
      if (unreadItems.length === 0) return;
      try {
        for (let i = 0; i < unreadItems.length; i += 400) {
          const batch = writeBatch(db);
          for (const n of unreadItems.slice(i, i + 400)) {
            batch.update(doc(db, 'notifications', n.id), { isRead: true });
          }
          await batch.commit();
        }
      } catch {
        Alert.alert('Could not update', 'Check your internet connection and try again.');
      }
    };
  
    const confirmDelete = (n: NotificationItem) => {
      Alert.alert('Delete notification', 'Remove this notification?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDoc(doc(db, 'notifications', n.id)).catch(() => {}),
        },
      ]);
    };
  
    const renderItem = ({ item }: { item: NotificationItem }) => {
      const meta = META[item.type] ?? META.new_event;
      return (
        <TouchableOpacity
          style={[styles.card, !item.isRead && styles.cardUnread]}
          activeOpacity={0.85}
          onPress={() => open(item)}
          onLongPress={() => confirmDelete(item)}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${meta.color}22` }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.body} numberOfLines={3}>
              {item.body}
            </Text>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          </View>
          {!item.isRead && <View style={styles.dot} />}
        </TouchableOpacity>
      );
    };
  
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.heading}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead} disabled={unread === 0} hitSlop={10}>
            <Text style={[styles.markAll, unread === 0 && { opacity: 0.4 }]}>Mark all read</Text>
          </TouchableOpacity>
        </View>
  
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(n) => n.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: spacing.md, gap: 10 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No notifications yet.</Text>
              </View>
            }
            ListFooterComponent={
              items.length > 0 ? (
                <Text style={styles.hint}>Press and hold a notification to delete it.</Text>
              ) : undefined
            }
          />
        )}
      </SafeAreaView>
    );
  }
  
  const makeStyles = (colors: Palette) =>
    StyleSheet.create({
      safe: { flex: 1, backgroundColor: colors.background },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      },
      heading: { fontSize: 22, fontWeight: '800', color: colors.text },
      markAll: { color: colors.primary, fontWeight: '700', fontSize: 13 },
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
      cardUnread: { backgroundColor: colors.unreadBg, borderColor: colors.border },
      iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      title: { fontSize: 14, color: colors.text },
      titleUnread: { fontWeight: '800' },
      body: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
      time: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
      dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
      empty: { alignItems: 'center', marginTop: 60, gap: 10 },
      emptyText: { color: colors.textMuted },
      hint: { textAlign: 'center', color: colors.textMuted, fontSize: 11, marginTop: 8 },
      error: { color: colors.mandatoryText, padding: spacing.md },
    });