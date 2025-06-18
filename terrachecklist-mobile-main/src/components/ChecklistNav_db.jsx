import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const steps = ["UAVPage_db", "PayloadPage_db", "GPSPage_db", "PPEPage_db" , "OtherPage_db", "HandoverPage_db"];

const ChecklistNav = ({ currentStep, navigation }) => {
  const handleNavigate = (stepIndex) => {
    const targetPage = steps[stepIndex];
    if (targetPage) {
      navigation.navigate(targetPage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tombol Back */}
      <TouchableOpacity
        onPress={() => handleNavigate(currentStep - 1)}
        disabled={currentStep === 0}
        style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
      >
        <MaterialIcons name="arrow-back" size={20} color="white" />
      </TouchableOpacity>

      {/* Timeline titik */}
      <View style={styles.timelineContainer}>
        {steps.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.circle, currentStep === index ? styles.activeCircle : null]}
            onPress={() => handleNavigate(index)}
          />
        ))}
      </View>

      {/* Tombol Next */}
      <TouchableOpacity
        onPress={() => handleNavigate(currentStep + 1)}
        disabled={currentStep === steps.length - 1}
        style={[styles.navButton, currentStep === steps.length - 1 && styles.disabledButton]}
      >
        <MaterialIcons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10, // Lebih kecil dari sebelumnya
    paddingHorizontal: 20,
    backgroundColor: "#1B2A52",
    borderRadius: 8,
    marginHorizontal: 5, // Lebih kecil dari sebelumnya
  },
  timelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  circle: {
    width: 8, // Dikecilkan
    height: 8, // Dikecilkan
    borderRadius: 4, // Proporsional
    backgroundColor: "gray",
    marginHorizontal: 5,
  },
  activeCircle: {
    backgroundColor: "#00CFFF",
  },
  navButton: {
    padding: 6, // Dikecilkan
    backgroundColor: "#00CFFF",
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: "gray",
  },
});

export default ChecklistNav;
