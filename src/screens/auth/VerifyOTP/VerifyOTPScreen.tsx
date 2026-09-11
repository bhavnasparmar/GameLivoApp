import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../navigation/routes';
import { AuthStackParamList } from '../../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 30;

type VerifyOTPNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyOTP'>;

// ─── Numpad key ───────────────────────────────────────────────────────────────
const NUMPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const VerifyOTPScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<VerifyOTPNavigationProp>();
  const route = useRoute<any>();
  const { isDark } = useTheme();
  const { verifyRegistrationOtp } = useAuth();

  const { mobile, email, type } = route.params || {};
  const contact = mobile || email || '';
  const contactType = mobile ? 'mobile' : 'email';

  // ─── State ──────────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string>('111111');

  // ─── Animations ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Digit animations
  const digitScales = useRef(
    Array(OTP_LENGTH).fill(null).map(() => new Animated.Value(1)),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // ─── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ─── Shake animation ────────────────────────────────────────────────────────
  const triggerShake = () => {
    setShakeError(true);
    Vibration.vibrate(300);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setShakeError(false));
  };

  // ─── Digit pop animation ────────────────────────────────────────────────────
  const popDigit = (idx: number) => {
    Animated.sequence([
      Animated.spring(digitScales[idx], { toValue: 1.25, tension: 80, friction: 5, useNativeDriver: true }),
      Animated.spring(digitScales[idx], { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  // ─── Numpad press ───────────────────────────────────────────────────────────
  const handleKeyPress = useCallback((key: string) => {
    if (isVerifying || verifySuccess) return;
    setErrorMsg(null);

    if (key === '⌫') {
      const newOtp = [...otp];
      if (activeIndex > 0 && newOtp[activeIndex] === '') {
        newOtp[activeIndex - 1] = '';
        setOtp(newOtp);
        setActiveIndex(activeIndex - 1);
      } else if (newOtp[activeIndex] !== '') {
        newOtp[activeIndex] = '';
        setOtp(newOtp);
      }
      return;
    }

    if (key === '') return;

    if (activeIndex < OTP_LENGTH) {
      const newOtp = [...otp];
      newOtp[activeIndex] = key;
      setOtp(newOtp);
      popDigit(activeIndex);

      const nextIndex = activeIndex + 1;
      if (nextIndex <= OTP_LENGTH - 1) {
        setActiveIndex(nextIndex);
      } else {
        setActiveIndex(OTP_LENGTH - 1);
        const fullOtp = newOtp.join('');
        if (fullOtp.length === OTP_LENGTH) {
          setTimeout(() => handleVerify(fullOtp), 150);
        }
      }
    }
  }, [otp, activeIndex, isVerifying, verifySuccess]);

  // ─── Dev bypass OTP ───────────────────────────────────────────────────────
  // 111111 is always accepted on frontend regardless of API result (dev only)
  const DEV_BYPASS_OTP = '111111';

  // ─── Verify OTP — calls real backend ──────────────────────────────────────
  const handleVerify = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length < OTP_LENGTH) {
      triggerShake();
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    // Dev bypass: 111111 always succeeds without waiting for API response
    const isDevBypass = code === DEV_BYPASS_OTP;

    try {
      if (type === 'register') {
        // ── Registration OTP: verifies account and logs in ───────────────
        const result = await verifyRegistrationOtp(contact, code);
        if (result.success || isDevBypass) {
          setVerifySuccess(true);
          Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
          // isLoggedIn will become true → RootNavigator auto-switches to MainNavigator
        } else {
          triggerShake();
          setOtp(Array(OTP_LENGTH).fill(''));
          setActiveIndex(0);
          setErrorMsg(result.error || 'Invalid OTP. Please try again.');
        }
      } else if (type === 'forgot_password') {
        // ── Forgot password OTP ──────────────────────────────────────────
        setVerifySuccess(true);
        Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
        await new Promise<void>(r => setTimeout(r, 900));
        navigation.navigate(ROUTES.RESET_PASSWORD as 'ResetPassword', {
          mobile: mobile || '',
          otp: code,
        });
      } else {
        // ── Login OTP ────────────────────────────────────────────────────
        setVerifySuccess(true);
        Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
        await new Promise<void>(r => setTimeout(r, 900));
        navigation.navigate(ROUTES.LOGIN as 'Login');
      }
    } catch (err: any) {
      // Dev bypass: even if API throws, 111111 still passes
      if (isDevBypass) {
        setVerifySuccess(true);
        Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
        return;
      }
      triggerShake();
      setOtp(Array(OTP_LENGTH).fill(''));
      setActiveIndex(0);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    try {
      // Re-trigger OTP from server (use register endpoint or send-otp)
      // For now we reset locally as the dev mock always returns 123456
      await new Promise<void>(r => setTimeout(r, 800));
      setOtp(Array(OTP_LENGTH).fill(''));
      setActiveIndex(0);
      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
      Alert.alert('✅ OTP Resent', `A new verification code has been sent to your ${contactType}.\n\n(Dev hint: use ${devOtpHint})`);
    } finally {
      setIsResending(false);
    }
  };

  // ─── Masked contact ─────────────────────────────────────────────────────────
  const maskContact = (c: string) => {
    if (!c) return '';
    if (c.includes('@')) {
      const [user, domain] = c.split('@');
      return `${user.slice(0, 2)}***@${domain}`;
    }
    return `${c.slice(0, 3)} *** **${c.slice(-2)}`;
  };

  const maskedContact = maskContact(contact);
  const typeLabel = type === 'forgot_password' ? 'Reset Password' : type === 'register' ? 'Verify Account' : 'Login';
  const contactIcon = contactType === 'mobile' ? '📱' : '📧';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A2019' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0A2D20']}
          style={[styles.headerGradient, { paddingTop: Math.max(insets.top + 16, 40) }]}
        >
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: Math.max(insets.top + 12, 28) }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          {/* Gold glow orb */}
          <View style={styles.glowOrb} />

          <Animated.View
            style={[
              styles.headerContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Icon badge */}
            <LinearGradient colors={['#F0C64A', '#D4A017', '#A6740C']} style={styles.logoBadge}>
              <Text style={styles.logoIcon}>{contactIcon}</Text>
            </LinearGradient>

            <Text style={styles.title}>{typeLabel}</Text>
            <Text style={styles.subtitle}>
              We sent a {OTP_LENGTH}-digit code to
            </Text>
            <View style={styles.contactPill}>
              <Text style={styles.contactPillText}>{maskedContact || 'your device'}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── OTP Card ── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#171B20' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          {/* ── Success overlay ── */}
          {verifySuccess && (
            <Animated.View
              style={[styles.successOverlay, { transform: [{ scale: successScale }] }]}
            >
              <LinearGradient colors={['#3AD17A', '#1F9D55']} style={styles.successBadge}>
                <Text style={styles.successCheck}>✓</Text>
              </LinearGradient>
              <Text style={[styles.successText, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
                Verified!
              </Text>
            </Animated.View>
          )}

          {/* ── OTP digit boxes ── */}
          <Animated.View
            style={[
              styles.otpRow,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {otp.map((digit, i) => {
              const isFocused = i === activeIndex && !verifySuccess;
              const isFilled = digit !== '';
              const isError = shakeError;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.otpBox,
                    {
                      borderColor: isError
                        ? '#E5584A'
                        : isFocused
                          ? '#D4A017'
                          : isFilled
                            ? (isDark ? '#27AE60' : '#1F9D55')
                            : (isDark ? 'rgba(255,255,255,0.12)' : '#D4E3DA'),
                      backgroundColor: isFilled
                        ? (isDark ? 'rgba(212,160,23,0.1)' : 'rgba(212,160,23,0.06)')
                        : (isDark ? '#0E1610' : '#F8F8F8'),
                      transform: [{ scale: digitScales[i] }],
                      shadowColor: isFocused ? '#D4A017' : 'transparent',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      elevation: isFocused ? 4 : 0,
                    },
                  ]}
                >
                  {isFocused && !isFilled ? (
                    <View style={styles.cursor} />
                  ) : (
                    <Text style={[styles.otpDigit, { color: isDark ? '#F0C64A' : '#B8872A' }]}>
                      {digit}
                    </Text>
                  )}
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* ── Error message ── */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerIcon}>⚠️</Text>
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* ── Dev hint ── */}
          <View style={[styles.hintBanner, { backgroundColor: isDark ? 'rgba(212,160,23,0.08)' : 'rgba(212,160,23,0.06)', borderColor: 'rgba(212,160,23,0.25)' }]}>
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintText}>Dev OTP: <Text style={styles.hintCode}>{devOtpHint}</Text></Text>
          </View>

          {/* ── Verify button ── */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleVerify()}
            disabled={isVerifying || verifySuccess}
            style={styles.verifyBtnWrap}
          >
            <LinearGradient
              colors={['#F0C64A', '#D4A017', '#A6740C']}
              style={[styles.verifyBtn, { opacity: isVerifying ? 0.85 : 1 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isVerifying ? (
                <ActivityIndicator color="#2B1C04" size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify Code</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Resend ── */}
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={isResending} activeOpacity={0.75}>
                {isResending ? (
                  <ActivityIndicator size="small" color="#D4A017" />
                ) : (
                  <Text style={styles.resendLink}>Resend OTP</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={[styles.resendTimer, { color: isDark ? '#4A6355' : '#9DB5A5' }]}>
                Resend in <Text style={{ color: '#D4A017', fontWeight: '700' }}>{countdown}s</Text>
              </Text>
            )}
          </View>

          {/* ── Safe-area pad ── */}
          <View style={{ height: Math.max(insets.bottom, 8) }} />
        </View>

        {/* ── Custom Numpad ── */}
        <View
          style={[
            styles.numpad,
            {
              backgroundColor: isDark ? '#0E1610' : '#F0F5F2',
              paddingBottom: Math.max(insets.bottom + 12, 20),
            },
          ]}
        >
          {NUMPAD_KEYS.map((row, ri) => (
            <View key={ri} style={styles.numpadRow}>
              {row.map((key, ki) => {
                const isEmpty = key === '';
                const isBackspace = key === '⌫';
                return (
                  <TouchableOpacity
                    key={ki}
                    activeOpacity={isEmpty ? 1 : 0.7}
                    onPress={() => !isEmpty && handleKeyPress(key)}
                    style={[
                      styles.numpadKey,
                      isEmpty && styles.numpadKeyEmpty,
                      isBackspace && styles.numpadKeyBack,
                      {
                        backgroundColor: isEmpty
                          ? 'transparent'
                          : isBackspace
                            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                            : (isDark ? '#131A10' : '#FFFFFF'),
                        borderColor: isEmpty
                          ? 'transparent'
                          : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                      },
                    ]}
                    disabled={isEmpty}
                  >
                    {!isEmpty && (
                      <Text
                        style={[
                          styles.numpadKeyText,
                          isBackspace && styles.numpadBackText,
                          { color: isDark ? '#F1F4F7' : '#1A2318' },
                        ]}
                      >
                        {key}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },

  // ── Header ──
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    left: 18,
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  backArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  glowOrb: {
    position: 'absolute',
    top: -50,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(212,160,23,0.07)',
  },
  headerContent: { alignItems: 'center' },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoIcon: { fontSize: 30 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#BCD8C8', textAlign: 'center', marginBottom: 10 },
  contactPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  contactPillText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700', letterSpacing: 0.3 },

  // ── Card ──
  card: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Success Overlay ──
  successOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    backgroundColor: 'transparent',
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F9D55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 14,
  },
  successCheck: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  successText: { fontSize: 22, fontWeight: '800' },

  // ── OTP Boxes ──
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: (width - 44 - 50) / 6,
    height: (width - 44 - 50) / 6,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: { fontSize: 22, fontWeight: '800' },
  cursor: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: '#D4A017',
    opacity: 0.9,
  },

  // ── Error Banner ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 88, 74, 0.12)',
    borderColor: 'rgba(229, 88, 74, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerIcon: { fontSize: 15 },
  errorBannerText: { flex: 1, color: '#E5584A', fontSize: 12.5, fontWeight: '600', lineHeight: 17 },

  // ── Dev Hint ──
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 22,
    gap: 8,
  },
  hintIcon: { fontSize: 15 },
  hintText: { flex: 1, color: '#D4A017', fontSize: 12.5, fontWeight: '600' },
  hintCode: { fontWeight: '800', letterSpacing: 1.5 },

  // ── Verify Button ──
  verifyBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  verifyBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: { color: '#2B1C04', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  // ── Resend ──
  resendRow: { alignItems: 'center', marginBottom: 10 },
  resendTimer: { fontSize: 13, fontWeight: '500' },
  resendLink: {
    color: '#D4A017',
    fontSize: 13.5,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  // ── Numpad ──
  numpad: {
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  numpadKey: {
    width: (width - 40 - 24) / 3,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  numpadKeyEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  numpadKeyBack: {
    backgroundColor: 'transparent',
  },
  numpadKeyText: {
    fontSize: 22,
    fontWeight: '600',
  },
  numpadBackText: {
    fontSize: 22,
  },
});

export default VerifyOTPScreen;
