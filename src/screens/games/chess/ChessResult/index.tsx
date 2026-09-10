import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── ChessResultScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement ChessResultScreen screen

const ChessResultScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ChessResultScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default ChessResultScreen;
