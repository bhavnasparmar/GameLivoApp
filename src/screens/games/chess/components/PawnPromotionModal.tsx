import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { ChessColor, ChessPieceType } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_PIECE_IMAGES } from '../../../../gameEngine/chess/chessConstants';

interface PawnPromotionModalProps {
  visible: boolean;
  color: ChessColor;
  onSelect: (pieceType: ChessPieceType) => void;
}

const PROMO_OPTIONS: { type: ChessPieceType; label: string; points: string }[] = [
  { type: 'queen', label: 'Queen', points: '+9' },
  { type: 'rook', label: 'Rook', points: '+5' },
  { type: 'bishop', label: 'Bishop', points: '+3' },
  { type: 'knight', label: 'Knight', points: '+3' },
];

export const PawnPromotionModal: React.FC<PawnPromotionModalProps> = ({
  visible,
  color,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <LinearGradient
            colors={['#1F261E', '#111713', '#0A0E0B']}
            style={styles.dialogInner}
          >
            <Text style={styles.crownIcon}>👑</Text>
            <Text style={styles.title}>Pawn Promotion</Text>
            <Text style={styles.subtitle}>Choose a piece to upgrade your pawn</Text>

            <View style={styles.optionsRow}>
              {PROMO_OPTIONS.map((opt) => {
                const pieceImage = CHESS_PIECE_IMAGES[color]?.[opt.type];
                return (
                  <TouchableOpacity
                    key={opt.type}
                    activeOpacity={0.8}
                    style={styles.cardBtn}
                    onPress={() => onSelect(opt.type)}
                  >
                    <LinearGradient
                      colors={['#2A362D', '#1B241E', '#101612']}
                      style={styles.cardGradient}
                    >
                      {pieceImage ? (
                        <FastImage
                          source={pieceImage}
                          style={styles.promoPieceImg as any}
                          resizeMode={FastImage.resizeMode.contain}
                        />
                      ) : null}
                      <Text style={styles.label}>{opt.label}</Text>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>{opt.points}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D4A017',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  dialogInner: {
    padding: 24,
    alignItems: 'center',
  },
  crownIcon: {
    fontSize: 34,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F0C64A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#9DB5A5',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  cardBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.35)',
  },
  cardGradient: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  promoPieceImg: {
    width: 44,
    height: 44,
  },
  glyphText: {
    fontSize: 32,
    lineHeight: 38,
    color: '#FFFFFF',
    textShadowColor: 'rgba(212, 160, 23, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EAF0EB',
    marginTop: 4,
  },
  pointsBadge: {
    backgroundColor: '#1F9D55',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  pointsText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default PawnPromotionModal;
