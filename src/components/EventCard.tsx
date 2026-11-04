import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventItem } from '../types';
import { colors, radius, spacing } from '../theme';
import { categoryColor } from '../utils/category';
import { formatDateTime } from '../utils/dates';

type Props = {
  event: EventItem;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
};

export default function EventCard({ event, saved, onPress, onToggleSave }: Props) {
  const tint = categoryColor(event.category);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrap}>
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: `${tint}22` }]}>
            <Ionicons name="calendar" size={42} color={tint} />
          </View>
        )}

        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: tint }]}>
            <Text style={styles.tagText}>{event.category}</Text>
          </View>
          {event.isMandatory && (
            <View style={[styles.tag, { backgroundColor: colors.mandatoryBg }]}>
              <Text style={[styles.tagText, { color: colors.mandatoryText }]}>MANDATORY</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.bookmark} onPress={onToggleSave} hitSlop={10}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.organizer} numberOfLines={1}>
          {event.organizerName}
        </Text>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text style={styles.meta}>{formatDateTime(event.startTime)}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={colors.accent} />
          <Text style={styles.meta} numberOfLines={1}>
            {event.venue}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrap: { height: 150 },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  tags: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bookmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.md },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  organizer: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  meta: { fontSize: 12, color: colors.textMuted, flexShrink: 1 },
});