import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export type ChessActionType = 'resign' | 'draw' | 'pause';

interface ChessActionModalProps {
  visible: boolean;
  type: ChessActionType;
  onConfirm: () => void;
  onCancel: () => void;
  isDark?: boolean;
}

export const ChessActionModal: React.FC<ChessActionModalProps> = ({
  visible,
  type,
  onConfirm,
  onCancel,
  isDark = true,
}) => {
  const contentMap = {
    resign: {
      icon: '🏳️',
      title: 'Resign Match?',
      sub: 'Are you sure you want to resign? Your opponent will win the match.',
      confirmText: 'Yes, Resign',
      confirmColors: ['#E6483A', '#8F1D13'],
    },
    draw: {
      icon: '🤝',
      title: 'Offer a Draw?',
      sub: 'Would you like to offer a draw to your opponent?',
      confirmText: 'Offer Draw',
      confirmColors: ['#2668D9', '#123A80'],
    },
    pause: {
      icon: '⏸️',
      title: 'Game Paused',
      sub: 'Take a breath. Resume whenever you are ready.',
      confirmText: 'Resume Game',
      confirmColors: ['#1F9D55', '#0D5230'],
    },
  };

  const current = contentMap[type] || contentMap.resign;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#141A16' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E0ECE4',
            },
          ]}
        >
          <Text style={styles.iconText}>{current.icon}</Text>
          <Text style={[styles.title, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
            {current.title}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
            {current.sub}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#202A24' : '#F0F6F2',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#D0E0D6',
                },
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: isDark ? '#B4C5BB' : '#5C7A6A' }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.confirmBtn}
              onPress={onConfirm}
            >
              <LinearGradient
                colors={current.confirmColors}
                style={styles.confirmGradient}
              >
                <Text style={styles.confirmText}>{current.confirmText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  iconText: {
    fontSize: 38,
    marginBottom: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ChessActionModal;
