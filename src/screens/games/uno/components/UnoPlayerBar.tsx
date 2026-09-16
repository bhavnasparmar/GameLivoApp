import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import UnoShoutButton from './UnoShoutButton';

interface UnoPlayerBarProps {
  hasCalledUno: boolean;
  canShoutUno: boolean;
  onShoutUno: () => void;
  onSendReaction?: (emoji: string) => void;
  onSendChat?: (message: string) => void;
}

const QUICK_REACTIONS = ['😂', '🔥', '😎', '😭', '👍', '👏', '😱', '🎉'];
const QUICK_CHATS = [
  'Good game! 🤝',
  'Well played! 🔥',
  'UNO! 🃏',
  'Draw 4 incoming! 😈',
  'Hurry up! ⏰',
  'Nice move! 👏',
];

export const UnoPlayerBar: React.FC<UnoPlayerBarProps> = ({
  hasCalledUno,
  canShoutUno,
  onShoutUno,
  onSendReaction,
  onSendChat,
}) => {
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const handleSelectEmoji = (emoji: string) => {
    setShowEmojiModal(false);
    onSendReaction?.(emoji);
  };

  const handleSelectChat = (msg: string) => {
    setShowChatModal(false);
    onSendChat?.(msg);
  };

  return (
    <View style={styles.container}>
      {/* 1. Left Emoji Reaction Button */}
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.circleActionBtn}
        onPress={() => setShowEmojiModal(true)}
      >
        <Text style={styles.actionBtnEmoji}>😊</Text>
      </TouchableOpacity>

      {/* 2. Center UNO Giant Glossy Red Pill Button */}
      <View style={styles.centerShoutWrap}>
        <UnoShoutButton
          onPress={onShoutUno}
          hasCalledUno={hasCalledUno}
          disabled={!canShoutUno && hasCalledUno}
        />
      </View>

      {/* 3. Right Chat Button */}
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.circleActionBtn}
        onPress={() => setShowChatModal(true)}
      >
        <Text style={styles.actionBtnEmoji}>💬</Text>
      </TouchableOpacity>

      {/* Emoji Reaction Modal */}
      <Modal
        visible={showEmojiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowEmojiModal(false)}
        >
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Quick Reaction</Text>
            <View style={styles.emojiGrid}>
              {QUICK_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.7}
                  style={styles.emojiTile}
                  onPress={() => handleSelectEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quick Chat Modal */}
      <Modal
        visible={showChatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChatModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowChatModal(false)}
        >
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Quick Messages</Text>
            <View style={styles.chatList}>
              {QUICK_CHATS.map((msg) => (
                <TouchableOpacity
                  key={msg}
                  activeOpacity={0.7}
                  style={styles.chatTile}
                  onPress={() => handleSelectChat(msg)}
                >
                  <Text style={styles.chatText}>{msg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
    width: '100%',
  },
  circleActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E272E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 6,
  },
  actionBtnEmoji: {
    fontSize: 22,
  },
  centerShoutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    paddingBottom: 90,
    alignItems: 'center',
  },
  popupCard: {
    backgroundColor: '#1E272E',
    borderRadius: 20,
    padding: 16,
    width: '90%',
    maxWidth: 340,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D2DAE2',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  emojiTile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  chatList: {
    width: '100%',
    gap: 8,
  },
  chatTile: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  chatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default UnoPlayerBar;
