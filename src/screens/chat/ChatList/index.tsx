import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── ChatListScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement ChatListScreen screen

const ChatListScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ChatListScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default ChatListScreen;
