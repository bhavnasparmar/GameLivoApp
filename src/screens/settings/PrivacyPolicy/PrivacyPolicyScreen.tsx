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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';

interface PolicyArticle {
  id: string;
  icon: string;
  title: string;
  summary: string;
  details: string;
}

const ARTICLES: PolicyArticle[] = [
  {
    id: '1',
    icon: '📋',
    title: '1. Personal Information We Collect',
    summary: 'Profile info, match records, and hardware diagnostics.',
    details:
      'We collect the username, email address, mobile number (for OTP verification), avatar image, game match telemetry (dice rolls, move times, win rates), and device hardware identifier to prevent multi-account exploit cheating.',
  },
  {
    id: '2',
    icon: '⚡',
    title: '2. How Your Data Is Utilized',
    summary: 'Matchmaking latency optimization, leaderboards, and rewards.',
    details:
      'Your telemetry is used to match you against players with similar skill rating (Elo/XP), deliver push notifications for your game turns, compute global tournament leaderboards, and award daily rewards.',
  },
  {
    id: '3',
    icon: '🔐',
    title: '3. Data Storage & Security Standards',
    summary: '256-bit encryption in transit and rest.',
    details:
      'All traffic between the GameLivo app and our real-time game servers is encrypted using TLS 1.3. User passwords and tokens are hashed with Argon2/bcrypt algorithms. We do not store plaintext payment card details.',
  },
  {
    id: '4',
    icon: '🤝',
    title: '4. Third-Party Sharing Restrictions',
    summary: 'We never sell your data to ad brokers.',
    details:
      'GameLivo does not sell, rent, or trade your personally identifiable information to advertisers. Data is only shared with essential infrastructure providers (AWS servers, Firebase notifications, SMS gateway for OTP).',
  },
  {
    id: '5',
    icon: '🛡️',
    title: '5. Player Rights & GDPR / DPDP Compliance',
    summary: 'Full access, export, and right to be forgotten.',
    details:
      'You have the legal right to request a full copy of your data archive or request immediate permanent account and match history deletion via the Data Safety screen in your settings.',
  },
  {
    id: '6',
    icon: '📬',
    title: '6. Data Protection Officer (DPO)',
    summary: 'Direct channel for privacy inquiries.',
    details:
      'If you have questions about your privacy rights or wish to lodge a query with our compliance team, you can email privacy@gamelivo.com or submit a support ticket in the Help Center.',
  },
];

export const PrivacyPolicyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const [expandedId, setExpandedId] = useState<string | null>('1');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleContactDPO = () => {
    Alert.alert(
      'Contact Privacy Team',
      'For official inquiries regarding privacy compliance, please email: privacy@gamelivo.com (Response within 24-48 hours).'
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Compliance Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>🔒 DPDP & GDPR Compliant</Text>
          </View>
          <View style={styles.badgePillGold}>
            <Text style={styles.badgeTextGold}>Verified Safe</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introText}>
          Your trust and privacy are fundamental to GameLivo. This policy outlines our transparent data handling practices.
        </Text>

        {ARTICLES.map(item => {
          const isExpanded = expandedId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.articleCard,
                {
                  backgroundColor: isDark ? '#102018' : '#FFFFFF',
                  borderColor: isExpanded ? '#27AE60' : isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6',
                },
              ]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: isDark ? '#182C22' : '#EAF4EE' }]}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
                <View style={styles.titleWrap}>
                  <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.summary}>{item.summary}</Text>
                </View>
                <Text style={[styles.chevron, isExpanded && styles.chevronRotated]}>›</Text>
              </View>

              {isExpanded && (
                <View style={styles.bodyWrap}>
                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFF5F1' }]} />
                  <Text style={styles.detailsText}>{item.details}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Contact DPO Button */}
        <TouchableOpacity
          style={styles.dpoBtn}
          onPress={handleContactDPO}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#1F9D55', '#0D5230']} style={styles.dpoBtnGradient}>
            <Text style={styles.dpoBtnText}>✉️ Contact Privacy Officer</Text>
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
    marginBottom: 14,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderColor: 'rgba(39,174,96,0.45)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#4BD07A',
    fontSize: 11,
    fontWeight: '700',
  },
  badgePillGold: {
    backgroundColor: 'rgba(240,198,74,0.2)',
    borderColor: 'rgba(240,198,74,0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTextGold: {
    color: '#F0C64A',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  introText: {
    fontSize: 12.5,
    color: '#7A9485',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  articleCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 17,
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  summary: {
    fontSize: 11.5,
    color: '#7A9485',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    color: '#7A9485',
    fontWeight: '700',
  },
  chevronRotated: {
    transform: [{ rotate: '90deg' }],
    color: '#4BD07A',
  },
  bodyWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 13,
    color: '#8CA597',
    lineHeight: 20,
    fontWeight: '500',
  },
  dpoBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  dpoBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpoBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default PrivacyPolicyScreen;
