import { createElement } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { formatLongDate, formatTimeRange } from '../utils/dates';
import { colors, radius } from '../theme';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
};

// "2026-11-04T22:30" in local time, the format a browser date box needs.
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function DateTimeField({ label, value, onChange }: Props) {
  const ts = Timestamp.fromDate(value);
  const text = `${formatLongDate(ts)} at ${formatTimeRange(ts, null)}`;

  // Android has separate date and time dialogs: pick the date first, then the time.
  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onChange: (e, date) => {
        if (e.type !== 'set' || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          onChange: (e2, time) => {
            if (e2.type !== 'set' || !time) return;
            const result = new Date(date);
            result.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(result);
          },
        });
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'web' ? (
        createElement('input', {
          type: 'datetime-local',
          value: toLocalInput(value),
          onChange: (e: { target: { value: string } }) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onChange(d);
          },
          style: {
            padding: 12,
            fontSize: 15,
            borderRadius: radius.md,
            border: '1px solid #D9DCE8',
            backgroundColor: colors.surface,
            color: colors.text,
          },
        })
      ) : Platform.OS === 'android' ? (
        <TouchableOpacity style={styles.box} onPress={openAndroid} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.text}>{text}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.iosRow}>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="compact"
            onChange={(_, d) => d && onChange(d)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D9DCE8',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  text: { color: colors.text, fontSize: 14, flexShrink: 1 },
  iosRow: { flexDirection: 'row', alignItems: 'center' },
});