import React, { useState, useRef, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';

interface PermissionState {
  id: string;
  name: string;
  description: string;
  icon: string;
  granted: boolean;
  required: boolean;
  category: string;
}

const INITIAL_PERMISSIONS: PermissionState[] = [
  {
    id: 'camera',
    name: 'Camera Access',
    description: 'Used for scanning friend QR codes, joining private lobbies, and uploading profile avatars.',
    icon: '📷',
    granted: true,
    required: false,
    category: 'Media & Hardware',
  },
  {
    id: 'microphone',
    name: 'Microphone & Voice Chat',
    description: 'Enables real-time live voice chat with teammates during Ludo, Uno, and Chess matches.',
    icon: '🎙️',
    granted: true,
    required: false,
    category: 'Media & Hardware',
  },
  {
    id: 'notifications',
    name: 'Push Notifications',
    description: 'Instant alerts for your turn in matches, friend match invitations, and daily coin rewards.',
    icon: '🔔',
    granted: true,
    required: true,
    category: 'Alerts & System',
  },
  {
    id: 'photos',
    name: 'Photos & Media Library',
    description: 'Allows saving match highlights, victory certificates, and selecting custom avatar photos.',
    icon: '🖼️',
    granted: false,
    required: false,
    category: 'Storage',
  },
  {
    id: 'nearby',
    name: 'Nearby Devices & LAN',
    description: 'Used for local multiplayer discovery so you can play with nearby friends offline.',
    icon: '📡',
    granted: true,
    required: false,
    category: 'Connectivity',
  },
];

export const PermissionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const [permissions, setPermissions] = useState<PermissionState[]>(INITIAL_PERMISSIONS);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleToggle = (id: string, value: boolean) => {
    setPermissions(prev =>
      prev.map(p => (p.id === id ? { ...p, granted: value } : p))
    );
  };

  const handleOpenSystemSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Open Settings',
        'Please go to your Device Settings > Applications > GameLivo to manage permissions.'
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#08120D' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* Header Banner */}
      <LinearGradient
        colors={isDark ? ['#1A3D2D', '#0F261C', '#08120D'] : ['#155A3F', '#0F4530', '#F4F9F5']}
        style={[styles.headerGradient, { paddingTop: Math.max(insets.top + 8, 20) }]}
      >
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Permissions</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🛡️</Text>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Privacy-First Gaming</Text>
            <Text style={styles.infoSubtitle}>
              GameLivo only requests permissions essential to live voice chat, match alerts, and social features. You are in full control.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>HARDWARE & SYSTEM ACCESS</Text>

        {permissions.map((perm, index) => (
          <View
            key={perm.id}
            style={[
              styles.permissionCard,
              {
                backgroundColor: isDark ? '#102018' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6',
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#172E23' : '#E8F4EC' }]}>
                <Text style={styles.permIcon}>{perm.icon}</Text>
              </View>

              <View style={styles.permTitleWrap}>
                <View style={styles.nameRow}>
                  <Text style={[styles.permName, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                    {perm.name}
                  </Text>
                  {perm.required && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Essential</Text>
                    </View>
                  )}
                </View>
                <View style={styles.statusPillRow}>
                  <View
                    style={[
                      styles.statusPill,
                      perm.granted ? styles.statusPillActive : styles.statusPillInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: perm.granted ? '#4BD07A' : '#E5584A' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: perm.granted ? '#4BD07A' : '#E5584A' },
                      ]}
                    >
                      {perm.granted ? 'Allowed' : 'Disabled'}
                    </Text>
                  </View>
                </View>
              </View>

              <Switch
                value={perm.granted}
                onValueChange={v => handleToggle(perm.id, v)}
                trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                thumbColor={perm.granted ? '#F0C64A' : '#7A8C82'}
              />
            </View>

            <Text style={styles.permDescription}>{perm.description}</Text>
          </View>
        ))}

        {/* System Settings Button */}
        <TouchableOpacity
          style={styles.systemBtn}
          onPress={handleOpenSystemSettings}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isDark ? ['#132A1F', '#0D1E16'] : ['#E8F4EC', '#DBECE0']}
            style={styles.systemBtnGradient}
          >
            <Text style={styles.systemBtnIcon}>⚙️</Text>
            <View style={styles.systemBtnTextWrap}>
              <Text style={[styles.systemBtnTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                Device System Settings
              </Text>
              <Text style={styles.systemBtnSubtitle}>
                Manage low-level OS permissions in your phone settings
              </Text>
            </View>
            <Text style={styles.systemChevron}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0C64A',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 11.5,
    color: '#BCD8C8',
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A9485',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  permissionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permIcon: {
    fontSize: 20,
  },
  permTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  permName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(240,198,74,0.15)',
    borderColor: 'rgba(240,198,74,0.4)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  recommendedText: {
    color: '#F0C64A',
    fontSize: 9.5,
    fontWeight: '800',
  },
  statusPillRow: {
    flexDirection: 'row',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 5,
  },
  statusPillActive: {
    backgroundColor: 'rgba(39,174,96,0.12)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(229,88,74,0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  permDescription: {
    fontSize: 12,
    color: '#7A9485',
    lineHeight: 17,
  },
  systemBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  systemBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  systemBtnIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  systemBtnTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  systemBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  systemBtnSubtitle: {
    fontSize: 11,
    color: '#7A9485',
  },
  systemChevron: {
    fontSize: 22,
    color: '#7A9485',
    fontWeight: '600',
  },
});

export default PermissionsScreen;
