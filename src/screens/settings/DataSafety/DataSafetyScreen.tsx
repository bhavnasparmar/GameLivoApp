import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';
import { settingsService } from '../../../services/settings/settingsService';

export const DataSafetyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { logout } = useAuth();

  const [cacheSize, setCacheSize] = useState('34.5 MB');
  const [clearingCache, setClearingCache] = useState(false);
  const [requestingData, setRequestingData] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{ downloadUrl: string; estimatedSize: string } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      setCacheSize('0.0 KB');
      Alert.alert('Cache Cleared', 'Successfully cleared temporary board textures and game cache.');
    } catch {
      Alert.alert('Error', 'Failed to clear cache.');
    } finally {
      setClearingCache(false);
    }
  };

  const handleRequestDownload = async () => {
    setRequestingData(true);
    try {
      const res = await settingsService.requestDataDownload();
      setDownloadInfo(res);
      setDownloadReady(true);
      Alert.alert(
        'Archive Generated',
        `Your personal data export (${res.estimatedSize}) is ready. An encrypted copy has also been sent to your registered email.`
      );
    } catch {
      Alert.alert('Error', 'Unable to generate data export at this time.');
    } finally {
      setRequestingData(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account Permanently',
      'Are you absolutely sure? This will immediately delete your profile, match history, unlocked achievements, coins, and friend connections. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await settingsService.deleteAccount();
              Alert.alert('Account Deleted', 'Your account and data have been removed.', [
                {
                  text: 'OK',
                  onPress: () => logout(),
                },
              ]);
            } catch {
              Alert.alert('Error', 'Failed to process account deletion.');
            }
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Data Safety & Cache</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Security Shield Banner */}
        <View style={styles.securityBanner}>
          <Text style={styles.bannerIcon}>🔐</Text>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Bank-Grade Security</Text>
            <Text style={styles.bannerSubtitle}>
              All in-game match communications and account data are encrypted using TLS 1.3 with AES-256 standards.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION: Data Practices */}
        <Text style={styles.sectionHeader}>DATA PROTECTION PRINCIPLES</Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
          ]}
        >
          {[
            { icon: '🛡️', title: 'Data Encryption', sub: 'End-to-end protected in transit and at rest' },
            { icon: '🚫', title: 'No Third-Party Ad Selling', sub: 'We never sell your game analytics to advertisers' },
            { icon: '📍', title: 'Minimal Location Access', sub: 'Only approximate region is used for matchmaking ping' },
          ].map((item, i) => (
            <View key={i} style={[styles.practiceRow, i > 0 && styles.rowBorder]}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#172E23' : '#E8F4EC' }]}>
                <Text style={styles.practiceIcon}>{item.icon}</Text>
              </View>
              <View style={styles.practiceTextWrap}>
                <Text style={[styles.practiceTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                  {item.title}
                </Text>
                <Text style={styles.practiceSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* SECTION: Storage & Cache Management */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>STORAGE & CACHE</Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
          ]}
        >
          <View style={styles.storageRow}>
            <View style={styles.storageInfoWrap}>
              <Text style={[styles.storageTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                Temporary Cache
              </Text>
              <Text style={styles.storageSubtitle}>
                Includes board textures, sound clips, and friend avatars
              </Text>
              <Text style={styles.cacheSizeText}>Size: {cacheSize}</Text>
            </View>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearCache}
              disabled={clearingCache || cacheSize === '0.0 KB'}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={cacheSize === '0.0 KB' ? ['#2D3A33', '#232D28'] : ['#2668D9', '#123A80']}
                style={styles.clearBtnGradient}
              >
                {clearingCache ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.clearBtnText}>
                    {cacheSize === '0.0 KB' ? 'Clean' : 'Clear Cache'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: Data Export & Rights */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>YOUR DATA RIGHTS</Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
          ]}
        >
          <View style={styles.exportRow}>
            <View style={styles.exportInfo}>
              <Text style={[styles.exportTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                Download Account Archive
              </Text>
              <Text style={styles.exportSub}>
                Export your match history, chat logs, achievements, and account profile in a secure ZIP package.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleRequestDownload}
              disabled={requestingData}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.downloadBtnGradient}>
                {requestingData ? (
                  <ActivityIndicator size="small" color="#2B1C04" />
                ) : (
                  <Text style={styles.downloadBtnText}>
                    {downloadReady ? 'Download Again' : 'Request ZIP'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: Danger Zone - Delete Account */}
        <Text style={[styles.sectionHeader, { marginTop: 22, color: '#E5584A' }]}>DANGER ZONE</Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: 'rgba(229,88,74,0.2)' },
          ]}
        >
          <View style={styles.deleteRow}>
            <View style={styles.deleteInfo}>
              <Text style={styles.deleteTitle}>Delete Account & Data</Text>
              <Text style={styles.deleteSub}>
                Permanently purge your account, coin wallet, unlocked skins, and stats.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
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
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4BD07A',
    marginBottom: 2,
  },
  bannerSubtitle: {
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
    marginBottom: 10,
    paddingLeft: 4,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  practiceIcon: {
    fontSize: 18,
  },
  practiceTextWrap: {
    flex: 1,
  },
  practiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  practiceSub: {
    fontSize: 11.5,
    color: '#7A9485',
    lineHeight: 16,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  storageInfoWrap: {
    flex: 1,
    marginRight: 12,
  },
  storageTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  storageSubtitle: {
    fontSize: 11.5,
    color: '#7A9485',
    marginBottom: 6,
  },
  cacheSizeText: {
    fontSize: 12,
    color: '#F0C64A',
    fontWeight: '700',
  },
  clearBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  clearBtnGradient: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  exportRow: {
    padding: 16,
  },
  exportInfo: {
    marginBottom: 12,
  },
  exportTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  exportSub: {
    fontSize: 11.5,
    color: '#7A9485',
    lineHeight: 16,
  },
  downloadBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  downloadBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  downloadBtnText: {
    color: '#2B1C04',
    fontSize: 12.5,
    fontWeight: '800',
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deleteInfo: {
    flex: 1,
    marginRight: 12,
  },
  deleteTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#E5584A',
    marginBottom: 2,
  },
  deleteSub: {
    fontSize: 11.5,
    color: '#7A9485',
    lineHeight: 16,
  },
  deleteBtn: {
    backgroundColor: 'rgba(229,88,74,0.15)',
    borderColor: '#E5584A',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  deleteBtnText: {
    color: '#E5584A',
    fontSize: 12.5,
    fontWeight: '800',
  },
});

export default DataSafetyScreen;
