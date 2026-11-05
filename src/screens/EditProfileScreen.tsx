import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { CLUBS, UserProfile, YEARS } from '../types';
import { Palette, radius, spacing, useColors, useThemedStyles } from '../theme';

export default function EditProfileScreen() {
  const { profile: authProfile } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('');
  const [club, setClub] = useState('None');
  const [photo, setPhoto] = useState('');
  const [photoLocal, setPhotoLocal] = useState(false);
  const [photoMime, setPhotoMime] = useState('image/jpeg');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isStudent = authProfile?.role === 'student';

  // Load the latest saved values from Firestore.
  useEffect(() => {
    const load = async () => {
      if (!authProfile) return;
      try {
        const snap = await getDoc(doc(db, 'users', authProfile.uid));
        const p = (snap.exists() ? snap.data() : authProfile) as UserProfile;
        setFullName(p.fullName ?? '');
        setYear(p.year ?? '');
        setClub(p.club || 'None');
        setPhoto(p.photoUrl ?? '');
      } catch {
        setFullName(authProfile.fullName);
        setYear(authProfile.year);
        setClub(authProfile.club || 'None');
        setPhoto(authProfile.photoUrl);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authProfile?.uid]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhoto(asset.uri);
    setPhotoMime(asset.mimeType ?? 'image/jpeg');
    setPhotoLocal(true);
  };

  const save = async () => {
    if (!authProfile) return;
    if (!fullName.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (isStudent && !year) {
      setError('Choose your year.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      let photoUrl = photo;
      if (photoLocal && photo) {
        photoUrl = await uploadToCloudinary(photo, photoMime, 'profile.jpg');
      }
      const changes: Record<string, string> = { fullName: fullName.trim(), photoUrl };
      if (isStudent) {
        changes.year = year;
        changes.club = club;
      }
      await updateDoc(doc(db, 'users', authProfile.uid), changes);
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarEmpty]}>
                    <Text style={styles.avatarText}>{(fullName || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickPhoto} style={{ marginTop: 8 }}>
                <Text style={styles.link}>{photo ? 'Change photo' : 'Add photo'}</Text>
              </TouchableOpacity>
              {photo ? (
                <TouchableOpacity
                  onPress={() => {
                    setPhoto('');
                    setPhotoLocal(false);
                  }}
                  style={{ marginTop: 4 }}
                >
                  <Text style={styles.removeLink}>Remove photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={colors.placeholder}
            />

            {isStudent && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>Year</Text>
                <View style={styles.chips}>
                  {YEARS.map((y) => (
                    <Chip key={y} label={y} active={year === y} onPress={() => setYear(y)} />
                  ))}
                </View>

                <Text style={styles.label}>Club</Text>
                <View style={styles.chips}>
                  {CLUBS.map((c) => (
                    <Chip key={c} label={c} active={club === c} onPress={() => setClub(c)} />
                  ))}
                </View>
              </>
            )}

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton title="SAVE CHANGES" onPress={save} loading={saving} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
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
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    avatar: { width: 96, height: 96, borderRadius: 48 },
    avatarEmpty: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    removeLink: { color: colors.error, fontWeight: '600', fontSize: 12 },
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
    errorBanner: {
      backgroundColor: colors.mandatoryBg,
      color: colors.mandatoryText,
      padding: 12,
      borderRadius: radius.sm,
      fontSize: 13,
    },
  });