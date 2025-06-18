import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

const SnakeLoading = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007BFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SnakeLoading;
