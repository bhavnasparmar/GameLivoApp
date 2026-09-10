import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── ChessHomeScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement ChessHomeScreen screen

const ChessHomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ChessHomeScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default ChessHomeScreen;
