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
import { resetToMain } from '../../../navigation/navigationRef';
import AppInput from '../../../components/inputs/AppInput';
import PasswordInput from '../../../components/inputs/PasswordInput';
import PrimaryButton from '../../../components/buttons/PrimaryButton';

const { width } = Dimensions.get('window');

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNavigationProp>();
  const { theme, isDark } = useTheme();
  const { login, isLoading, error: authError, resetError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Subtle logo scale animation
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
    let isValid = true;
    setIdentifierError(null);
    setPasswordError(null);
    resetError();

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setIdentifierError('Please enter your email, username, or mobile number');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes('@');
    const isMobile = /^\+?[0-9]{7,15}$/.test(trimmedIdentifier);

    const success = await login({
      identifier: trimmedIdentifier,
      email: isEmail ? trimmedIdentifier : undefined,
      mobile: isMobile ? trimmedIdentifier : undefined,
      username: !isEmail && !isMobile ? trimmedIdentifier : undefined,
      password,
    });

    if (success) {
      resetToMain();
    }
  };

  const handleForgotPassword = () => {
    resetError();
    navigation.navigate(ROUTES.FORGOT_PASSWORD as 'ForgotPassword');
  };

  const handleSignUp = () => {
    resetError();
    navigation.navigate(ROUTES.REGISTER as 'Register');
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // Social auth action
    console.log(`Continue with ${provider}`);
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
          <View style={styles.glowCircle} />

          <Animated.View
            style={[
              styles.headerContent,
              { opacity: fadeAnim, transform: [{ scale: logoScale }] },
            ]}
          >
            {/* 3D Gold Logo Container */}
            <LinearGradient
              colors={['#F0C64A', '#D4A017', '#A6740C']}
              style={styles.logoBadge}
            >
              <Text style={styles.logoIcon}>🎲</Text>
            </LinearGradient>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Log in to keep your rank, coins & friends
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

          {/* Form Fields */}
          <AppInput
            label="Email or Username"
            placeholder="aarav.kapoor@email.com"
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

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError}
            isRequired
          />

          {/* Forgot Password Link */}
          <View style={styles.forgotRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleForgotPassword}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.forgotText, { color: theme.colors.accentLight || '#D4A017' }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary Login Button */}
          <PrimaryButton
            title="Log In"
            onPress={handleLogin}
            isLoading={isLoading}
            containerStyle={styles.loginBtnContainer}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E0E0E0' },
              ]}
            />
            <Text
              style={[
                styles.dividerText,
                { color: isDark ? '#7A9485' : '#8E8E93' },
              ]}
            >
              or continue with
            </Text>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E0E0E0' },
              ]}
            />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.socialBtn,
                {
                  backgroundColor: isDark ? '#20252D' : '#F5F5F7',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA',
                },
              ]}
              onPress={() => handleSocialLogin('google')}
            >
              <View style={styles.googleBadge}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text
                style={[
                  styles.socialBtnText,
                  { color: isDark ? '#F1F4F7' : '#1C1C1E' },
                ]}
              >
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.socialBtn,
                {
                  backgroundColor: isDark ? '#20252D' : '#F5F5F7',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA',
                },
              ]}
              onPress={() => handleSocialLogin('facebook')}
            >
              <View style={styles.facebookBadge}>
                <Text style={styles.facebookIconText}>f</Text>
              </View>
              <Text
                style={[
                  styles.socialBtnText,
                  { color: isDark ? '#F1F4F7' : '#1C1C1E' },
                ]}
              >
                Facebook
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer: Register Link */}
          <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
            <Text
              style={[
                styles.footerText,
                { color: isDark ? '#96A1AD' : '#6B6154' },
              ]}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignUp}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
            >
              <Text
                style={[
                  styles.signUpLink,
                  { color: theme.colors.accentLight || '#D4A017' },
                ]}
              >
                Sign Up
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
    justifyContent: 'space-between',
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 36,
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
    flex: 1,
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
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  loginBtnContainer: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11.5,
    fontWeight: '600',
    paddingHorizontal: 12,
    letterSpacing: 0.2,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  googleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4285F4',
  },
  facebookBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  facebookIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
  signUpLink: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default LoginScreen;
