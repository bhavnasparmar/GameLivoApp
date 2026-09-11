import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';
import { useAppSelector } from '../../../redux/hooks';
import { selectUserProfile } from '../../../redux/selectors/userSelectors';
import { settingsService, UserPreferences } from '../../../services/settings/settingsService';
import { ROUTES } from '../../../navigation/routes';

const { width } = Dimensions.get('window');

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const userProfile = useAppSelector(selectUserProfile);

  const [prefs, setPrefs] = useState<UserPreferences>({
    notifications: true,
    matchAlerts: true,
    friendActivity: true,
    marketingEmails: false,
    soundEffects: true,
    bgMusic: true,
    haptics: true,
    theme: 'dark',
    language: 'English',
  });

  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Load saved preferences
    settingsService.getPreferences().then(saved => {
      if (saved) setPrefs(saved);
    });
  }, [fadeAnim, slideAnim]);

  const handleToggle = async (key: keyof UserPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSavingKey(key);
    try {
      await settingsService.updatePreferences({ [key]: value });
    } catch {
      // optimistic update retained
    } finally {
      setTimeout(() => setSavingKey(null), 300);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of GameLivo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const displayName = userProfile?.name || 'Player';
  const displayUsername = userProfile?.username || 'player_one';
  const displayLevel = userProfile?.level || 1;
  const displayCoins = userProfile?.coins || 1000;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#08120D' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* Header Banner */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#08120D'] : ['#155A3F', '#0F4530', '#F4F9F5']}
        style={[styles.headerGradient, { paddingTop: Math.max(insets.top + 8, 24) }]}
      >
        <View style={styles.topNavRow}>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.badgeWrapper}>
            <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>PRO v1.0</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Profile Summary Card */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
        >
          <LinearGradient
            colors={isDark ? ['#132A1F', '#0D1E16'] : ['#FFFFFF', '#EBF4EE']}
            style={styles.profileCardGradient}
          >
            <View style={styles.avatarGlow}>
              <LinearGradient colors={['#F0C64A', '#D4A017', '#9E740C']} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
                {displayName}
              </Text>
              <Text style={styles.profileHandle}>@{displayUsername}</Text>
              <View style={styles.metaRow}>
                <View style={styles.levelPill}>
                  <Text style={styles.levelPillText}>Lv. {displayLevel}</Text>
                </View>
                <View style={styles.coinsPill}>
                  <Text style={styles.coinsPillText}>🪙 {displayCoins.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 90, 110) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION: Audio & Game Feedback */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>AUDIO & GAMEPLAY</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
            ]}
          >
            <View style={styles.rowItem}>
              <View style={[styles.iconBox, { backgroundColor: '#2668D922' }]}>
                <Text style={styles.rowIcon}>🔊</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Sound Effects</Text>
                <Text style={styles.rowSubtitle}>Dice rolls, token moves, victory chimes</Text>
              </View>
              <Switch
                value={prefs.soundEffects}
                onValueChange={v => handleToggle('soundEffects', v)}
                trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                thumbColor={prefs.soundEffects ? '#F0C64A' : '#7A8C82'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

            <View style={styles.rowItem}>
              <View style={[styles.iconBox, { backgroundColor: '#9A4BD122' }]}>
                <Text style={styles.rowIcon}>🎵</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Background Music</Text>
                <Text style={styles.rowSubtitle}>Ambient background music in lobby and matches</Text>
              </View>
              <Switch
                value={prefs.bgMusic}
                onValueChange={v => handleToggle('bgMusic', v)}
                trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                thumbColor={prefs.bgMusic ? '#F0C64A' : '#7A8C82'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

            <View style={styles.rowItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F2B70522' }]}>
                <Text style={styles.rowIcon}>📳</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Haptic Feedback</Text>
                <Text style={styles.rowSubtitle}>Vibration on turn alerts and game events</Text>
              </View>
              <Switch
                value={prefs.haptics}
                onValueChange={v => handleToggle('haptics', v)}
                trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                thumbColor={prefs.haptics ? '#F0C64A' : '#7A8C82'}
              />
            </View>
          </View>
        </View>

        {/* SECTION: Notifications */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
            ]}
          >
            <View style={styles.rowItem}>
              <View style={[styles.iconBox, { backgroundColor: '#1F9D5522' }]}>
                <Text style={styles.rowIcon}>🔔</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Push Notifications</Text>
                <Text style={styles.rowSubtitle}>All game notifications and system alerts</Text>
              </View>
              <Switch
                value={prefs.notifications}
                onValueChange={v => handleToggle('notifications', v)}
                trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                thumbColor={prefs.notifications ? '#F0C64A' : '#7A8C82'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

            <View style={styles.rowItem}>
              <View style={[styles.iconBox, { backgroundColor: '#E6483A22' }]}>
                <Text style={styles.rowIcon}>⚔️</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Match & Turn Invites</Text>
                <Text style={styles.rowSubtitle}>Alert when your turn is ready or friend invites</Text>
              </View>
              <Switch
                value={prefs.matchAlerts}
                onValueChange={v => handleToggle('matchAlerts', v)}
                trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                thumbColor={prefs.matchAlerts ? '#F0C64A' : '#7A8C82'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

            <View style={styles.rowItem}>
              <View style={[styles.iconBox, { backgroundColor: '#3A7BD522' }]}>
                <Text style={styles.rowIcon}>👥</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Friend Activity</Text>
                <Text style={styles.rowSubtitle}>When friends come online or achieve milestones</Text>
              </View>
              <Switch
                value={prefs.friendActivity}
                onValueChange={v => handleToggle('friendActivity', v)}
                trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                thumbColor={prefs.friendActivity ? '#F0C64A' : '#7A8C82'}
              />
            </View>
          </View>
        </View>

        {/* SECTION: Privacy, Security & Blocked Users */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>PRIVACY & SECURITY</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
            ]}
          >
            <TouchableOpacity
              style={styles.navRowItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ROUTES.PRIVACY_SECURITY)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E5584A22' }]}>
                <Text style={styles.rowIcon}>🛡️</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <View style={styles.titleBadgeRow}>
                  <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                    Privacy & Blocked Users
                  </Text>
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightBadgeText}>Block/Unblock</Text>
                  </View>
                </View>
                <Text style={styles.rowSubtitle}>Manage blocked accounts, visibility & 2FA</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

            <TouchableOpacity
              style={styles.navRowItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ROUTES.PERMISSIONS)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#9A4BD122' }]}>
                <Text style={styles.rowIcon}>📱</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>App Permissions</Text>
                <Text style={styles.rowSubtitle}>Camera, microphone, storage access</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

            <TouchableOpacity
              style={styles.navRowItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ROUTES.DATA_SAFETY)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#1F9D5522' }]}>
                <Text style={styles.rowIcon}>💾</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Data Safety & Cache</Text>
                <Text style={styles.rowSubtitle}>Download data, manage storage & cache</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: Legal & Support */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>SUPPORT & LEGAL</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
            ]}
          >
            <TouchableOpacity
              style={styles.navRowItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ROUTES.TERMS)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F0C64A22' }]}>
                <Text style={styles.rowIcon}>📜</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Terms of Service</Text>
                <Text style={styles.rowSubtitle}>User agreements, fair play & rules</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

            <TouchableOpacity
              style={styles.navRowItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ROUTES.PRIVACY_POLICY)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#2668D922' }]}>
                <Text style={styles.rowIcon}>🔒</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>Privacy Policy</Text>
                <Text style={styles.rowSubtitle}>How your personal data is protected</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: Danger Zone */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: '#E5584A' }]}>ACCOUNT ACTIONS</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(229,88,74,0.15)' : '#FCE8E6' },
            ]}
          >
            <TouchableOpacity
              style={styles.navRowItem}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E5584A22' }]}>
                <Text style={styles.rowIcon}>🚪</Text>
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: '#E5584A' }]}>Log Out</Text>
                <Text style={styles.rowSubtitle}>Log out of your current session</Text>
              </View>
              <Text style={[styles.chevron, { color: '#E5584A88' }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.brandTitle}>GameLivo Gaming Platform</Text>
          <Text style={styles.versionText}>Version 1.0.4 (Build 2026.09) • Production</Text>
          <Text style={styles.copyrightText}>© 2026 GameLivo Inc. All rights reserved.</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  badgeWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#2B1C04',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  profileCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    borderRadius: 20,
  },
  avatarGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    backgroundColor: 'rgba(212,160,23,0.3)',
    marginRight: 14,
  },
  avatar: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#2B1C04',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileHandle: {
    fontSize: 12,
    color: '#8CA597',
    fontWeight: '500',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelPill: {
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderColor: 'rgba(39,174,96,0.5)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelPillText: {
    color: '#4BD07A',
    fontSize: 10.5,
    fontWeight: '700',
  },
  coinsPill: {
    backgroundColor: 'rgba(212,160,23,0.2)',
    borderColor: 'rgba(212,160,23,0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  coinsPillText: {
    color: '#F0C64A',
    fontSize: 10.5,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  editBtnText: {
    color: '#F0C64A',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#7A8C82',
    fontWeight: '600',
    lineHeight: 22,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#7A9485',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 6,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  navRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowIcon: {
    fontSize: 17,
  },
  rowTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 11.5,
    color: '#7A9485',
    fontWeight: '500',
    lineHeight: 16,
  },
  highlightBadge: {
    backgroundColor: '#E5584A22',
    borderColor: '#E5584A55',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  highlightBadgeText: {
    color: '#FF6B5B',
    fontSize: 9.5,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A9485',
    marginBottom: 3,
  },
  versionText: {
    fontSize: 11,
    color: '#556E61',
    fontWeight: '500',
    marginBottom: 2,
  },
  copyrightText: {
    fontSize: 10,
    color: '#41554B',
    fontWeight: '500',
  },
});

export default SettingsScreen;
