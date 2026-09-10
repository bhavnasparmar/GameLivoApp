import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── MatchHistoryScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement MatchHistoryScreen screen

const MatchHistoryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MatchHistoryScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default MatchHistoryScreen;
