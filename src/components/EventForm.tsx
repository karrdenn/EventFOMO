import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import DateTimeField from './DateTimeField';
import PrimaryButton from './PrimaryButton';
import { uploadToCloudinary } from '../services/cloudinary';
import { CATEGORIES, EventItem, MANDATORY_GROUPS, ORGANIZERS } from '../types';
import { Palette, radius, spacing, useColors, useThemedStyles } from '../theme';

// Everything the form produces. The screen that uses the form saves it to Firestore.
export type EventFormData = {
  title: string;
  description: string;
  category: string;
  venue: string;
  startTime: Timestamp;
  endTime: Timestamp;
  speakerName: string;
  coverImageUrl: string;
  organizerName: string;
  isMandatory: boolean;
  mandatoryFor: string[];
  scheduleType: '' | 'pdf' | 'text';
  scheduleContent: string;
};

type Props = {
  existing?: EventItem; // given when editing, empty when creating
  submitLabel: string;
  onSubmit: (data: EventFormData) => Promise<void>;
};

type ScheduleMode = 'none' | 'pdf' | 'text';

const TWO_HOURS = 2 * 60 * 60 * 1000;
const CLUB_ORGANIZERS = ['ACM', 'BRCS', 'NDLD'];

function defaultStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function EventForm({ existing, submitLabel, onSubmit }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  const knownClub = !!existing && CLUB_ORGANIZERS.includes(existing.organizerName);
  const oldGroups = existing?.mandatoryFor ?? [];
  const oldSchedule = existing?.scheduleType ?? '';

  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [speaker, setSpeaker] = useState(existing?.speakerName ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');

  const [organizer, setOrganizer] = useState(existing ? (knownClub ? existing.organizerName : 'Other') : '');
  const [organizerText, setOrganizerText] = useState(existing && !knownClub ? existing.organizerName : '');

  const [start, setStart] = useState<Date>(existing ? existing.startTime.toDate() : defaultStart());
  const [end, setEnd] = useState<Date>(
    existing ? existing.endTime.toDate() : new Date(defaultStart().getTime() + TWO_HOURS)
  );

  const [coverPreview, setCoverPreview] = useState(existing?.coverImageUrl ?? '');
  const [coverLocal, setCoverLocal] = useState(false); // true when a new picture was just chosen
  const [coverMime, setCoverMime] = useState('image/jpeg');

  const [isMandatory, setIsMandatory] = useState(existing?.isMandatory ?? false);
  const [groups, setGroups] = useState<string[]>(oldGroups.filter((g) => MANDATORY_GROUPS.includes(g)));
  const [customGroups, setCustomGroups] = useState(
    oldGroups.filter((g) => !MANDATORY_GROUPS.includes(g)).join(', ')
  );

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
    oldSchedule === 'pdf' ? 'pdf' : oldSchedule === 'text' ? 'text' : 'none'
  );
  const existingPdfUrl = existing?.scheduleType === 'pdf' ? existing.scheduleContent : '';
  const [pdf, setPdf] = useState<{ uri: string; name: string } | null>(null);
  const [scheduleText, setScheduleText] = useState(existing?.scheduleType === 'text' ? existing.scheduleContent : '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // When the start time moves, move the end time with it so the length stays the same.
  const onStartChange = (d: Date) => {
    const diff = end.getTime() - start.getTime();
    setStart(d);
    setEnd(new Date(d.getTime() + (diff > 0 ? diff : TWO_HOURS)));
  };

  const toggleGroup = (g: string) =>
    setGroups((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setCoverPreview(asset.uri);
    setCoverMime(asset.mimeType ?? 'image/jpeg');
    setCoverLocal(true);
  };

  const removeImage = () => {
    setCoverPreview('');
    setCoverLocal(false);
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      Alert.alert('File too large', 'Choose a PDF smaller than 10 MB.');
      return;
    }
    setPdf({ uri: asset.uri, name: asset.name });
  };

  const validate = (): string => {
    if (!title.trim()) return 'Enter the event title.';
    if (!category) return 'Choose a category.';
    if (!venue.trim()) return 'Enter the venue.';
    if (end.getTime() <= start.getTime()) return 'The end time must be after the start time.';
    if (!existing && end.getTime() < Date.now()) return 'The event must end in the future.';
    if (!organizer) return 'Choose the organizer.';
    if ((organizer === 'Department' || organizer === 'Other') && !organizerText.trim()) {
      return 'Type the organizer name.';
    }
    if (isMandatory && groups.length === 0 && !customGroups.trim()) {
      return 'Choose at least one group that must attend.';
    }
    if (scheduleMode === 'pdf' && !pdf && !existingPdfUrl) {
      return 'Choose a PDF file, or set the schedule to None.';
    }
    if (scheduleMode === 'text' && !scheduleText.trim()) {
      return 'Type the program schedule, or set it to None.';
    }
    return '';
  };

  const handleSubmit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      let coverImageUrl = coverPreview;
      if (coverLocal && coverPreview) {
        coverImageUrl = await uploadToCloudinary(coverPreview, coverMime, 'cover.jpg');
      }

      let scheduleType: '' | 'pdf' | 'text' = '';
      let scheduleContent = '';
      if (scheduleMode === 'pdf') {
        scheduleType = 'pdf';
        scheduleContent = pdf
          ? await uploadToCloudinary(pdf.uri, 'application/pdf', pdf.name)
          : existingPdfUrl;
      } else if (scheduleMode === 'text') {
        scheduleType = 'text';
        scheduleContent = scheduleText.trim();
      }

      const custom = customGroups
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        venue: venue.trim(),
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        speakerName: speaker.trim(),
        coverImageUrl,
        organizerName:
          organizer === 'Department' || organizer === 'Other' ? organizerText.trim() : organizer,
        isMandatory,
        mandatoryFor: isMandatory ? [...groups, ...custom] : [],
        scheduleType,
        scheduleContent,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Event Title" placeholder="Title of the event" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <DateTimeField label="Starts" value={start} onChange={onStartChange} />
        <DateTimeField label="Ends" value={end} onChange={setEnd} />

        <Field label="Venue" placeholder="e.g. Convention Hall" value={venue} onChangeText={setVenue} />

        <Text style={styles.label}>Organizer</Text>
        <View style={styles.chips}>
          {ORGANIZERS.map((o) => (
            <Chip key={o} label={o} active={organizer === o} onPress={() => setOrganizer(o)} />
          ))}
        </View>
        {(organizer === 'Department' || organizer === 'Other') && (
          <Field
            label={organizer === 'Department' ? 'Department name' : 'Organizer name'}
            placeholder={organizer === 'Department' ? 'e.g. Computing Technologies' : 'Who is organizing?'}
            value={organizerText}
            onChangeText={setOrganizerText}
          />
        )}

        <Field
          label="Speaker (optional)"
          placeholder="Guest speaker or host"
          value={speaker}
          onChangeText={setSpeaker}
        />
        <Field
          label="Description"
          placeholder="Tell people what the event is about"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Cover Image (optional)</Text>
        {coverPreview ? (
          <View style={styles.coverBox}>
            <Image source={{ uri: coverPreview }} style={styles.coverImage} resizeMode="cover" />
            <TouchableOpacity style={styles.removeBtn} onPress={removeImage} hitSlop={10}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.coverBox, styles.coverEmpty]} onPress={pickImage}>
            <Ionicons name="add" size={36} color={colors.primary} />
            <Text style={styles.coverText}>Upload Cover Image</Text>
          </TouchableOpacity>
        )}
        {coverPreview ? (
          <TouchableOpacity onPress={pickImage} style={{ marginTop: 8 }}>
            <Text style={styles.link}>Change image</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Mark as Mandatory</Text>
          <Switch
            value={isMandatory}
            onValueChange={setIsMandatory}
            trackColor={{ true: colors.primary }}
          />
        </View>
        {isMandatory && (
          <>
            <Text style={styles.label}>Who must attend?</Text>
            <View style={styles.chips}>
              {MANDATORY_GROUPS.map((g) => (
                <Chip key={g} label={g} active={groups.includes(g)} onPress={() => toggleGroup(g)} />
              ))}
            </View>
            <Field
              label="Custom group (optional)"
              placeholder="e.g. Robotics Club, Staff"
              value={customGroups}
              onChangeText={setCustomGroups}
            />
          </>
        )}

        <Text style={[styles.label, { marginTop: spacing.sm }]}>Program Schedule (optional)</Text>
        <View style={styles.chips}>
          <Chip label="None" active={scheduleMode === 'none'} onPress={() => setScheduleMode('none')} />
          <Chip label="Upload PDF" active={scheduleMode === 'pdf'} onPress={() => setScheduleMode('pdf')} />
          <Chip label="Add as Text" active={scheduleMode === 'text'} onPress={() => setScheduleMode('text')} />
        </View>
        {scheduleMode === 'pdf' && (
          <TouchableOpacity style={styles.pdfBox} onPress={pickPdf}>
            <Ionicons name="document-text" size={22} color={colors.error} />
            <Text style={styles.pdfText} numberOfLines={1}>
              {pdf ? pdf.name : existingPdfUrl ? 'Current PDF attached. Tap to replace.' : 'Choose a PDF file'}
            </Text>
          </TouchableOpacity>
        )}
        {scheduleMode === 'text' && (
          <Field
            label="Schedule"
            placeholder={'09:00 Welcome\n09:30 Keynote'}
            value={scheduleText}
            onChangeText={setScheduleText}
            multiline
          />
        )}

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <View style={{ marginTop: spacing.md }}>
          <PrimaryButton title={submitLabel} onPress={handleSubmit} loading={submitting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...rest }: TextInputProps & { label: string }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, rest.multiline && styles.multiline]}
        placeholderTextColor={colors.placeholder}
        {...rest}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    fieldWrap: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    multiline: { minHeight: 100, textAlignVertical: 'top' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.text, fontSize: 13 },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    coverBox: { height: 170, borderRadius: radius.md, overflow: 'hidden' },
    coverEmpty: {
      backgroundColor: colors.tint,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverText: { color: colors.primary, fontWeight: '600', marginTop: 4 },
    coverImage: { width: '100%', height: '100%' },
    removeBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      paddingVertical: 8,
    },
    switchLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    pdfBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 16,
    },
    pdfText: { flex: 1, color: colors.text },
    errorBanner: {
      backgroundColor: colors.mandatoryBg,
      color: colors.mandatoryText,
      padding: 12,
      borderRadius: radius.sm,
      fontSize: 13,
    },
  });