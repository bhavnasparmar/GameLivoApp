import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── EstoLobbyScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement EstoLobbyScreen screen

const EstoLobbyScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>EstoLobbyScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default EstoLobbyScreen;
