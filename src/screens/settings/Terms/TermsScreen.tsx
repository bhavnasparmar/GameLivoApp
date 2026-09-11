import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';

interface TermSection {
  id: string;
  icon: string;
  title: string;
  content: string;
}

const SECTIONS: TermSection[] = [
  {
    id: '1',
    icon: '📜',
    title: '1. Acceptance of Terms',
    content:
      'By creating an account, downloading, or accessing GameLivo, you agree to be bound by these Terms of Service. If you do not agree, you must discontinue using GameLivo immediately.',
  },
  {
    id: '2',
    icon: '🛡️',
    title: '2. Fair Play & Anti-Cheating',
    content:
      'GameLivo enforces a strict zero-tolerance policy against unfair gameplay. Using unauthorized third-party mods, memory injectors, automation bots, or exploiting match timer latency will result in immediate permanent account termination without refund.',
  },
  {
    id: '3',
    icon: '🪙',
    title: '3. Virtual Coins & Rewards',
    content:
      'Coins, gems, badges, and cosmetics earned or purchased in GameLivo are virtual goods with no real-world monetary value outside our platform. Coins cannot be redeemed for fiat currency unless specified in certified promotional tournament events.',
  },
  {
    id: '4',
    icon: '💬',
    title: '4. Code of Conduct & Chat Safety',
    content:
      'Players must treat all community members with respect. Harassment, hate speech, vulgarity in voice/text chat, spamming game invites, and inappropriate avatars will lead to chat mutes or direct account suspension.',
  },
  {
    id: '5',
    icon: '🚫',
    title: '5. Blocking & Reporting Players',
    content:
      'You have full control over your multiplayer experience. You may block or report players at any time through match results or the Privacy & Security settings screen. Blocked players cannot challenge or message you.',
  },
  {
    id: '6',
    icon: '⚖️',
    title: '6. Limitation of Liability',
    content:
      'GameLivo is provided "as is". While we strive for 99.9% multiplayer uptime, we are not liable for match disruptions caused by network disconnects, device compatibility issues, or scheduled server maintenance.',
  },
];

export const TermsScreen: React.FC = () => {
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Status Pill */}
        <View style={styles.statusRow}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>Effective: September 2026</Text>
          </View>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>Version 2.4</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introText}>
          Please read these Terms carefully before participating in GameLivo matches, tournaments, or community features.
        </Text>

        {SECTIONS.map(section => {
          const isExpanded = expandedId === section.id;
          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#102018' : '#FFFFFF',
                  borderColor: isExpanded ? '#D4A017' : isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6',
                },
              ]}
              onPress={() => toggleExpand(section.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: isDark ? '#182C22' : '#EAF4EE' }]}>
                  <Text style={styles.icon}>{section.icon}</Text>
                </View>
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                  {section.title}
                </Text>
                <Text style={[styles.chevron, isExpanded && styles.chevronRotated]}>›</Text>
              </View>

              {isExpanded && (
                <View style={styles.bodyWrap}>
                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFF5F1' }]} />
                  <Text style={styles.contentText}>{section.content}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  datePillText: {
    color: '#BCD8C8',
    fontSize: 11,
    fontWeight: '700',
  },
  versionPill: {
    backgroundColor: 'rgba(240,198,74,0.2)',
    borderColor: 'rgba(240,198,74,0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  versionPillText: {
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
  sectionCard: {
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
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 22,
    color: '#7A9485',
    fontWeight: '700',
  },
  chevronRotated: {
    transform: [{ rotate: '90deg' }],
    color: '#D4A017',
  },
  bodyWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 13,
    color: '#8CA597',
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default TermsScreen;
