import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme';

interface TabMeta {
  icon: string;
  label: string;
}

const TAB_CONFIG: Record<string, TabMeta> = {
  GameHub: { icon: '🎲', label: 'Hub' },
  Friends: { icon: '👥', label: 'Friends' },
  Rewards: { icon: '🎁', label: 'Rewards' },
  Profile: { icon: '🏆', label: 'Profile' },
  Settings: { icon: '⚙️', label: 'Settings' },
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C2129' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const meta = TAB_CONFIG[route.name] || {
            icon: '🎮',
            label: options.title || route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              <View style={styles.tabContent}>
                {isFocused ? (
                  <LinearGradient
                    colors={['#F0C64A', '#D4A017', '#A6740C']}
                    style={styles.activeIconBadge}
                  >
                    <Text style={styles.tabIconActive}>{meta.icon}</Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.inactiveIconBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                  >
                    <Text style={styles.tabIcon}>{meta.icon}</Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? theme.colors.accentLight || '#D4A017'
                        : isDark
                        ? '#7A9485'
                        : '#8E8E93',
                      fontWeight: isFocused ? '800' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>

                {/* Subtle active indicator dot */}
                {isFocused ? (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: theme.colors.accentLight || '#D4A017' },
                    ]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  inactiveIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.75,
  },
  tabIconActive: {
    fontSize: 19,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 3,
  },
});

export default BottomTabBar;
