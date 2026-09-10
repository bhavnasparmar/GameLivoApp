import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── ChessLobbyScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement ChessLobbyScreen screen

const ChessLobbyScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ChessLobbyScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default ChessLobbyScreen;
