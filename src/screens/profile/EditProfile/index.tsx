import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── EditProfileScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement EditProfileScreen screen

const EditProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>EditProfileScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default EditProfileScreen;
