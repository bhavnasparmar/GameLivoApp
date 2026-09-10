import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── ChessGameScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement ChessGameScreen screen

const ChessGameScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ChessGameScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default ChessGameScreen;
