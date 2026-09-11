import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../navigation/routes';
import { AuthStackParamList } from '../../../navigation/types';
import AppInput from '../../../components/inputs/AppInput';
import PasswordInput from '../../../components/inputs/PasswordInput';
import PrimaryButton from '../../../components/buttons/PrimaryButton';

const { width } = Dimensions.get('window');

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterNavigationProp>();
  const { theme, isDark } = useTheme();
  const { register, isLoading, error: authError, resetError } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Field validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Input Refs for smooth keyboard jumping
  const usernameInputRef = useRef<any>(null);
  const contactInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  const referralInputRef = useRef<any>(null);

  // Animations
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, fadeAnim]);

  // Calculate password strength (0: None, 1: Weak, 2: Fair, 3: Strong)
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: '#6E7D73' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 10) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: '#E5584A' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#E5A93D' };
    return { score: 3, label: 'Strong', color: '#1F9D55' };
  };

  const strength = getPasswordStrength(password);

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError(null);
    setUsernameError(null);
    setContactError(null);
    setPasswordError(null);
    setTermsError(null);
    resetError();

    // 1. Full Name Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Please enter your full name');
      isValid = false;
    } else if (trimmedName.length < 2) {
      setNameError('Full name must be at least 2 characters');
      isValid = false;
    } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      setNameError('Name should contain only letters');
      isValid = false;
    }

    // 2. Username Validation
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      setUsernameError('Please enter a username');
      isValid = false;
    } else if (cleanUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (cleanUsername.length > 20) {
      setUsernameError('Username must not exceed 20 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    }

    // 3. Email or Mobile Validation
    const cleanContact = emailOrMobile.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneCharsOnly = /^[0-9+\s()-]+$/;

    if (!cleanContact) {
      setContactError('Please enter your email or mobile number');
      isValid = false;
    } else if (cleanContact.includes('@') || /[a-zA-Z]/.test(cleanContact)) {
      // User is attempting email
      if (!emailRegex.test(cleanContact)) {
        setContactError('Please enter a valid email address (e.g. name@example.com)');
        isValid = false;
      }
    } else if (phoneCharsOnly.test(cleanContact)) {
      // User is attempting mobile number
      const digitsOnly = cleanContact.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setContactError('Mobile number must be at least 10 digits');
        isValid = false;
      } else if (digitsOnly.length > 15) {
        setContactError('Mobile number cannot exceed 15 digits');
        isValid = false;
      }
    } else {
      setContactError('Please enter a valid email address or 10-digit mobile number');
      isValid = false;
    }

    // 4. Password Validation
    if (!password) {
      setPasswordError('Please create a password');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      isValid = false;
    }

    // 5. Terms Agreement Validation
    if (!agreedToTerms) {
      setTermsError('Please accept the Terms of Service and Privacy Policy');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const cleanContact = emailOrMobile.trim();
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanContact);
    const cleanMobile = cleanContact.replace(/[\s-]/g, '');
    const isMobile = !isEmail && /^\+?[0-9]{10,15}$/.test(cleanMobile);
    const cleanUsername = username.trim().replace(/^@/, '');

    const payload = {
      name: name.trim(),
      username: cleanUsername,
      email: isEmail ? cleanContact.toLowerCase() : undefined,
      // Backend validation requires E.164 format for phone (+91xxxxxxxxxx)
      phone: isMobile ? (cleanMobile.startsWith('+') ? cleanMobile : `+91${cleanMobile.replace(/^0/, '')}`) : undefined,
      password,
      referralCode: referralCode.trim() || undefined,
    };

    const result = await register(payload as any);

    if (result.success && result.contact) {
      // Navigate to OTP screen using the contact returned by the server
      const serverContact = result.contact;
      const contactType = result.contactType;
      navigation.navigate(ROUTES.VERIFY_OTP as 'VerifyOTP', {
        mobile: contactType === 'phone' ? serverContact : undefined,
        email: contactType === 'email' ? serverContact : undefined,
        type: 'register',
      });
    }
  };

  const handleGoToLogin = () => {
    resetError();
    navigation.navigate(ROUTES.LOGIN as 'Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Deep Forest Green Header */}
        <LinearGradient
          colors={
            isDark
              ? ['#0F3628', '#0A2019', '#061611']
              : ['#155A3F', '#0F4530', '#0A2D20']
          }
          style={[styles.headerGradient, { paddingTop: Math.max(insets.top + 16, 36) }]}
        >
          {/* Subtle gold ambient glow element */}
          <View pointerEvents="none" style={styles.glowCircle} />

          <Animated.View
            style={[
              styles.headerContent,
              { opacity: fadeAnim, transform: [{ scale: logoScale }] },
            ]}
          >
            {/* 3D Gold Joystick Logo Container */}
            <LinearGradient
              colors={['#F0C64A', '#D4A017', '#A6740C']}
              style={styles.logoBadge}
            >
              <Text style={styles.logoIcon}>🕹️</Text>
            </LinearGradient>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join 100,000+ players and start winning
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Main Form Sheet */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? '#171B20' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          {/* Server Error Alert Banner */}
          {authError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerIcon}>⚠️</Text>
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <AppInput
            label="Full Name"
            placeholder="Aarav Kapoor"
            value={name}
            onChangeText={text => {
              setName(text);
              if (nameError) setNameError(null);
            }}
            returnKeyType="next"
            onSubmitEditing={() => usernameInputRef.current?.focus()}
            blurOnSubmit={false}
            error={nameError}
            isRequired
          />

          {/* Username with prefix */}
          <AppInput
            ref={usernameInputRef}
            label="Username"
            placeholder="unique_username"
            value={username}
            onChangeText={text => {
              setUsername(text);
              if (usernameError) setUsernameError(null);
            }}
            leftIcon={
              <Text style={[styles.prefixText, { color: isDark ? '#D6A83A' : '#1F9D55' }]}>
                @
              </Text>
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => contactInputRef.current?.focus()}
            blurOnSubmit={false}
            error={usernameError}
            isRequired
          />

          {/* Email or Mobile */}
          <AppInput
            ref={contactInputRef}
            label="Email or Mobile"
            placeholder="you@email.com or +91 9876543210"
            value={emailOrMobile}
            onChangeText={text => {
              setEmailOrMobile(text);
              if (contactError) setContactError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
            error={contactError}
            isRequired
          />

          {/* Password with Eye Toggle */}
          <PasswordInput
            ref={passwordInputRef}
            label="Password"
            placeholder="Create a strong password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            returnKeyType="next"
            onSubmitEditing={() => referralInputRef.current?.focus()}
            blurOnSubmit={false}
            error={passwordError}
            isRequired
          />

          {/* Password Strength Meter */}
          {password.length > 0 ? (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarRow}>
                <View
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor:
                        strength.score >= 1 ? strength.color : isDark ? '#282E38' : '#E0E0E0',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor:
                        strength.score >= 2 ? strength.color : isDark ? '#282E38' : '#E0E0E0',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor:
                        strength.score >= 3 ? strength.color : isDark ? '#282E38' : '#E0E0E0',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                Strength: {strength.label}
              </Text>
            </View>
          ) : null}

          {/* Referral Code (Optional) */}
          <AppInput
            ref={referralInputRef}
            label="Referral Code (Optional)"
            placeholder="FRIEND2026"
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            containerStyle={{ marginBottom: 12 }}
          />

          {/* Terms Agreement Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              if (termsError) setTermsError(null);
            }}
            style={styles.termsRow}
          >
            <View
              style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxActive,
                {
                  borderColor: agreedToTerms
                    ? theme.colors.accent
                    : isDark
                    ? '#3A5045'
                    : '#C0C0C0',
                  backgroundColor: agreedToTerms
                    ? theme.colors.accent
                    : isDark
                    ? '#20252D'
                    : '#F0F4F1',
                },
              ]}
            >
              {agreedToTerms ? <Text style={styles.checkIcon}>✓</Text> : null}
            </View>
            <Text
              style={[
                styles.termsText,
                { color: isDark ? '#B8C8BE' : theme.colors.textSecondary },
              ]}
            >
              I agree to the{' '}
              <Text style={[styles.termsHighlight, { color: theme.colors.accentLight || '#D4A017' }]}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={[styles.termsHighlight, { color: theme.colors.accentLight || '#D4A017' }]}>
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {termsError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {termsError}
            </Text>
          ) : null}

          {/* Register Button */}
          <PrimaryButton
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            containerStyle={styles.registerBtnContainer}
          />

          {/* Footer: Login Link */}
          <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
            <Text
              style={[
                styles.footerText,
                { color: isDark ? '#96A1AD' : '#6B6154' },
              ]}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleGoToLogin}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
            >
              <Text
                style={[
                  styles.loginLink,
                  { color: theme.colors.accentLight || '#D4A017' },
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0A2019',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#BCD8C8',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  cardContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 88, 74, 0.12)',
    borderColor: 'rgba(229, 88, 74, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  errorBannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    color: '#E5584A',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
  },
  strengthContainer: {
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxActive: {
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  checkIcon: {
    color: '#2B1C04',
    fontSize: 14,
    fontWeight: '900',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  termsHighlight: {
    fontWeight: '700',
  },
  errorText: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: -8,
    marginBottom: 14,
    marginLeft: 4,
  },
  registerBtnContainer: {
    marginTop: 4,
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default RegisterScreen;
