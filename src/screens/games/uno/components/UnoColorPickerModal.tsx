import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { UnoActiveColor } from '../../../../gameEngine/uno/unoTypes';
import { UNO_COLOR_THEMES } from '../../../../gameEngine/uno/unoConstants';

interface UnoColorPickerModalProps {
  visible: boolean;
  onSelectColor: (color: UnoActiveColor) => void;
}

const COLOR_OPTIONS: Array<{
  color: UnoActiveColor;
  label: string;
  glyph: string;
  gradient: [string, string];
}> = [
  { color: 'red', label: 'RED', glyph: '🔴', gradient: UNO_COLOR_THEMES.red.gradient },
  { color: 'blue', label: 'BLUE', glyph: '🔵', gradient: UNO_COLOR_THEMES.blue.gradient },
  { color: 'green', label: 'GREEN', glyph: '🟢', gradient: UNO_COLOR_THEMES.green.gradient },
  { color: 'yellow', label: 'YELLOW', glyph: '🟡', gradient: UNO_COLOR_THEMES.yellow.gradient },
];

export const UnoColorPickerModal: React.FC<UnoColorPickerModalProps> = ({
  visible,
  onSelectColor,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>CHOOSE NEXT COLOR</Text>
          <Text style={styles.subtitle}>Select the active color for the table</Text>

          {/* 4-Color Quadrant Grid */}
          <View style={styles.grid}>
            {COLOR_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.color}
                activeOpacity={0.8}
                style={styles.quadrantBtn}
                onPress={() => onSelectColor(item.color)}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.quadrantGradient}
                >
                  <Text style={styles.quadrantEmoji}>{item.glyph}</Text>
                  <Text style={styles.quadrantLabel}>{item.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#121A16',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F1C40F',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8CA093',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  quadrantBtn: {
    width: '46%',
    aspectRatio: 1.1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  quadrantGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quadrantEmoji: {
    fontSize: 28,
  },
  quadrantLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});

export default UnoColorPickerModal;
