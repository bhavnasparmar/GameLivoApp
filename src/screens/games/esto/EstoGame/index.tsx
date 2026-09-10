import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── EstoGameScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement EstoGameScreen screen

const EstoGameScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>EstoGameScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default EstoGameScreen;
