import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme } from '../../../theme';
import { useAppDispatch } from '../../../redux/hooks';
import { updateProfile } from '../../../redux/slices/userSlice';
import { userService } from '../../../services/user/userService';
import { UserProfile } from '../../../types/user';

const { width } = Dimensions.get('window');

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
};

// ─── Reusable field component ─────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
  hint?: string;
  isDark: boolean;
  error?: string | null;
}

const FormField: React.FC<FieldProps> = ({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  autoCapitalize = 'sentences', multiline = false, maxLength, editable = true,
  hint, isDark, error,
}) => (
  <View style={fieldStyles.wrapper}>
    <Text style={[fieldStyles.label, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>{label}</Text>
    <View
      style={[
        fieldStyles.inputBox,
        {
          backgroundColor: editable ? (isDark ? '#111E17' : '#FFFFFF') : (isDark ? '#0E1610' : '#F5F7F5'),
          borderColor: error
            ? '#E5584A'
            : editable
              ? (isDark ? 'rgba(255,255,255,0.12)' : '#D4E3DA')
              : (isDark ? 'rgba(255,255,255,0.05)' : '#EAF0EB'),
        },
      ]}
    >
      <TextInput
        style={[
          fieldStyles.input,
          { color: editable ? (isDark ? '#F1F4F7' : '#1A2318') : (isDark ? '#3A5045' : '#9DB5A5') },
          multiline && { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={isDark ? '#3A5045' : '#9DB5A5'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        maxLength={maxLength}
        editable={editable}
      />
      {maxLength && (
        <Text style={[fieldStyles.charCount, { color: isDark ? '#3A5045' : '#B0C4BB' }]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
    {error ? (
      <Text style={fieldStyles.errorText}>{error}</Text>
    ) : hint ? (
      <Text style={[fieldStyles.hint, { color: isDark ? '#3A5045' : '#9DB5A5' }]}>{hint}</Text>
    ) : null}
  </View>
);

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginLeft: 2 },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },
  input: { flex: 1, fontSize: 14.5, fontWeight: '500', height: 50, paddingVertical: 0 },
  charCount: { fontSize: 11, fontWeight: '600', alignSelf: 'flex-end', paddingBottom: 14 },
  errorText: { color: '#E5584A', fontSize: 11.5, fontWeight: '600', marginTop: 4, marginLeft: 2 },
  hint: { fontSize: 11, fontWeight: '500', marginTop: 4, marginLeft: 2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { isDark } = useTheme();

  const existingProfile: UserProfile | undefined = route.params?.profile;

  const [name, setName] = useState(existingProfile?.name || '');
  const [username, setUsername] = useState(existingProfile?.username || '');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [email, setEmail] = useState(existingProfile?.email || '');
  const [instagram, setInstagram] = useState(existingProfile?.socialLinks?.instagram || '');
  const [twitter, setTwitter] = useState(existingProfile?.socialLinks?.twitter || '');

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initials = getInitials(name || 'U');

  // ─── Validate ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!username.trim()) newErrors.username = 'Username is required';
    if (username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (/\s/.test(username)) newErrors.username = 'Username cannot contain spaces';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setIsSaving(true);

    const payload: Partial<UserProfile> = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim() || undefined,
      email: email.trim() || undefined,
      socialLinks: {
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
      },
    };

    // Optimistic update
    dispatch(updateProfile(payload));

    try {
      const updated = await userService.updateProfile(payload);
      dispatch(updateProfile(updated));
      Alert.alert('✅ Profile Updated', 'Your profile has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      // Revert optimistic update
      if (existingProfile) dispatch(updateProfile(existingProfile));
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile. Please try again.';
      Alert.alert('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  }, [name, username, bio, email, instagram, twitter, dispatch, navigation, existingProfile]);

  const hasChanges =
    name !== (existingProfile?.name || '') ||
    username !== (existingProfile?.username || '') ||
    bio !== (existingProfile?.bio || '') ||
    email !== (existingProfile?.email || '') ||
    instagram !== (existingProfile?.socialLinks?.instagram || '') ||
    twitter !== (existingProfile?.socialLinks?.twitter || '');

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0B1410' : '#F4F9F5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* ── Appbar ── */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        <View style={styles.appBarRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (hasChanges) {
                Alert.alert('Discard Changes?', 'You have unsaved changes.', [
                  { text: 'Keep Editing', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                ]);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.appBarTitle}>Edit Profile</Text>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            activeOpacity={0.8}
            style={[styles.saveBtn, { opacity: hasChanges ? 1 : 0.4 }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#2B1C04" />
            ) : (
              <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.saveBtnGradient}>
                <Text style={styles.saveBtnText}>Save</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 30, 40) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Preview ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <LinearGradient colors={['#F0C64A', '#D4A017', '#A6740C']} style={styles.avatarGradient}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.avatarHint, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
            Avatar is generated from your initials
          </Text>
        </View>

        {/* ── Form Card ── */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: isDark ? '#0E1610' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8F0EA' },
          ]}
        >
          <Text style={[styles.cardSectionLabel, { color: isDark ? '#D4A017' : '#B8872A' }]}>
            Basic Info
          </Text>

          <FormField
            label="Full Name"
            value={name}
            onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
            placeholder="Your full name"
            autoCapitalize="words"
            maxLength={50}
            isDark={isDark}
            error={errors.name}
          />

          <FormField
            label="Username"
            value={username}
            onChangeText={t => { setUsername(t.toLowerCase().replace(/\s/g, '')); setErrors(e => ({ ...e, username: '' })); }}
            placeholder="your.username"
            autoCapitalize="none"
            maxLength={30}
            isDark={isDark}
            error={errors.username}
            hint="Only letters, numbers, and dots"
          />

          <FormField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the world about yourself…"
            autoCapitalize="sentences"
            multiline
            maxLength={120}
            isDark={isDark}
          />
        </View>

        {/* ── Contact Card ── */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: isDark ? '#0E1610' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8F0EA' },
          ]}
        >
          <Text style={[styles.cardSectionLabel, { color: isDark ? '#D4A017' : '#B8872A' }]}>
            Contact
          </Text>

          <FormField
            label="Email (optional)"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            isDark={isDark}
            error={errors.email}
          />

          <FormField
            label="Mobile"
            value={existingProfile?.mobile || ''}
            onChangeText={() => {}}
            editable={false}
            isDark={isDark}
            hint="To change your mobile number, contact support"
          />
        </View>

        {/* ── Social Links Card ── */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: isDark ? '#0E1610' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8F0EA' },
          ]}
        >
          <Text style={[styles.cardSectionLabel, { color: isDark ? '#D4A017' : '#B8872A' }]}>
            Social Links (optional)
          </Text>

          <FormField
            label="Instagram"
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@your_instagram"
            autoCapitalize="none"
            isDark={isDark}
          />
          <FormField
            label="Twitter / X"
            value={twitter}
            onChangeText={setTwitter}
            placeholder="@your_twitter"
            autoCapitalize="none"
            isDark={isDark}
          />
        </View>

        {/* ── Save CTA ── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !hasChanges}
          activeOpacity={0.85}
          style={{ opacity: hasChanges ? 1 : 0.45 }}
        >
          <LinearGradient
            colors={['#F0C64A', '#D4A017', '#A6740C']}
            style={styles.saveCta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#2B1C04" />
            ) : (
              <Text style={styles.saveCtaText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Appbar ──
  appBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  appBarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  saveBtn: { borderRadius: 11, overflow: 'hidden', shadowColor: '#D4A017', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 5, elevation: 3 },
  saveBtnGradient: { paddingVertical: 8, paddingHorizontal: 16 },
  saveBtnText: { color: '#2B1C04', fontSize: 13, fontWeight: '800' },

  // ── Body ──
  scrollContent: { paddingTop: 24, paddingHorizontal: 16 },

  // ── Avatar ──
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    backgroundColor: 'rgba(212,160,23,0.3)',
    marginBottom: 10,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarGradient: { flex: 1, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#2B1C04', fontSize: 26, fontWeight: '800' },
  avatarHint: { fontSize: 12, fontWeight: '500' },

  // ── Form Cards ──
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 16,
  },

  // ── Save CTA ──
  saveCta: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  saveCtaText: { color: '#2B1C04', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});

export default EditProfileScreen;
