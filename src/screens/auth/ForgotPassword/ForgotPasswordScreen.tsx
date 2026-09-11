import React, { useState, useEffect } from 'react';
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
import PrimaryButton from '../../../components/buttons/PrimaryButton';

const { width } = Dimensions.get('window');

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { theme, isDark } = useTheme();
  const { forgotPassword, isLoading, error: authError, resetError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Animations
  const logoScale = useState(new Animated.Value(0.85))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

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

  const validateForm = (): boolean => {
    setIdentifierError(null);
    resetError();

    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError('Please enter your registered email or mobile number');
      return false;
    }

    const isEmail = trimmed.includes('@');
    const isMobile = /^\+?[0-9]{7,15}$/.test(trimmed);

    if (!isEmail && !isMobile) {
      setIdentifierError('Please enter a valid email address or phone number');
      return false;
    }

    return true;
  };

  const handleSendReset = async () => {
    if (!validateForm()) return;

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const isMobile = /^\+?[0-9]{7,15}$/.test(trimmed);

    const result = await forgotPassword(trimmed);

    if (result.success) {
      // Navigate to OTP screen for password reset verification
      navigation.navigate(ROUTES.VERIFY_OTP as 'VerifyOTP', {
        ...(isMobile ? { mobile: trimmed } : {}),
        ...(isEmail ? { email: trimmed } : {}),
        type: 'forgot_password',
      });
    }
  };

  const handleGoToLogin = () => {
    resetError();
    navigation.navigate(ROUTES.LOGIN as 'Login');
  };

  const handleResetForm = () => {
    setIsSuccess(false);
    setIdentifier('');
    resetError();
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
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleGoToLogin}
            style={[styles.backBtn, { top: Math.max(insets.top + 12, 28) }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          {/* Subtle gold ambient glow element */}
          <View style={styles.glowCircle} />

          <Animated.View
            style={[
              styles.headerContent,
              { opacity: fadeAnim, transform: [{ scale: logoScale }] },
            ]}
          >
            {/* 3D Gold Lock Badge */}
            <LinearGradient
              colors={['#F0C64A', '#D4A017', '#A6740C']}
              style={styles.logoBadge}
            >
              <Text style={styles.logoIcon}>🔒</Text>
            </LinearGradient>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email or phone and we'll send you instructions to reset your password
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
          {!isSuccess ? (
            /* Request Form View */
            <View>
              {/* Server Error Alert Banner */}
              {authError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerIcon}>⚠️</Text>
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              ) : null}

              <AppInput
                label="Email or Mobile"
                placeholder="you@email.com"
                value={identifier}
                onChangeText={text => {
                  setIdentifier(text);
                  if (identifierError) setIdentifierError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                error={identifierError}
                isRequired
              />

              <PrimaryButton
                title="Send Reset Link"
                onPress={handleSendReset}
                isLoading={isLoading}
                containerStyle={styles.sendBtnContainer}
              />

              {/* Footer: Remembered it? Log In */}
              <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
                <Text
                  style={[
                    styles.footerText,
                    { color: isDark ? '#96A1AD' : '#6B6154' },
                  ]}
                >
                  Remembered it?{' '}
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
          ) : (
            /* Success Sent View */
            <View style={styles.successContainer}>
              <LinearGradient
                colors={['#3AD17A', '#1F9D55']}
                style={styles.successBadge}
              >
                <Text style={styles.successCheckmark}>✓</Text>
              </LinearGradient>

              <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>
                Check your inbox
              </Text>
              <Text
                style={[
                  styles.successSubtitle,
                  { color: isDark ? '#96A1AD' : '#6B6154' },
                ]}
              >
                {successMessage ||
                  "We've sent a password reset link to your email. It may take a minute to arrive."}
              </Text>

              <PrimaryButton
                title="Back to Log In"
                onPress={handleGoToLogin}
                containerStyle={styles.successPrimaryBtn}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetForm}
                style={[
                  styles.ghostBtn,
                  {
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D4E3DA',
                    backgroundColor: isDark ? '#20252D' : '#F0F4F1',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ghostBtnText,
                    { color: isDark ? '#F1F4F7' : '#0D1B12' },
                  ]}
                >
                  Use a different email or phone
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    justifyContent: 'space-between',
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
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
    maxWidth: 270,
    lineHeight: 18,
  },
  cardContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
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
  sendBtnContainer: {
    marginTop: 8,
    marginBottom: 24,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  successBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#1F9D55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  successCheckmark: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
    maxWidth: 290,
  },
  successPrimaryBtn: {
    marginBottom: 12,
  },
  ghostBtn: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
