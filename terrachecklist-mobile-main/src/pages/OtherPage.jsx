import { AntDesign } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChecklistNavigator from "../components/ChecklistNav";
import { useProject } from "./ProjectContext"; // Import ProjectContext

const OtherPage = ({ navigation }) => {
  const {
    projectCode,
    otherEquipment,
    otherCheckedItems,
    setOtherCheckedItems,
    otherItemNotes,
    setOtherItemNotes,
    otherNotesInput,
    setOtherNotesInput,
  } = useProject(); // Use ProjectContext for state management

  const normalizeKey = (key) => key.toLowerCase().replace(/ /g, "_");
  

  const toggleCheck = (itemKey) => {
    const normalizedKey = normalizeKey(itemKey);
    setOtherCheckedItems((prev) => ({
      ...prev,
      [normalizedKey]: !prev[normalizedKey],
    }));
  };

  const handleNoteChange = (itemKey, text) => {
    const normalizedKey = normalizeKey(itemKey);
    setOtherItemNotes((prev) => ({
      ...prev,
      [normalizedKey]: text,
    }));
  };

  const renderDynamicFields = () => {
    if (!otherEquipment || otherEquipment.length === 0) {
      return (
        <Text style={styles.notFoundText}>
          No equipment found for this project.
        </Text>
      );
    }

   

    const groupedEquipment = otherEquipment.reduce((acc, item) => {
      const name = item.name || "Unknown Equipment";
      if (!acc[name]) acc[name] = [];
      acc[name].push(item);
      return acc;
    }, {});

    return Object.entries(groupedEquipment).map(([name, items], idx) => (
      <View key={idx} style={styles.section}>
        <Text style={styles.sectionTitle}>{name}</Text>
        {items.map((equipment, subIdx) => {
          const equipmentId = equipment.id || "Unknown ID";
          const uniqueKey = `${name}_${equipmentId}`;
          const normalizedKey = normalizeKey(uniqueKey);

          return (
            <View key={subIdx} style={styles.itemContainer}>
              <Text style={styles.itemText}>{equipmentId}</Text>
              <TouchableOpacity
                style={[
                  styles.checkButton,
                  otherCheckedItems[normalizedKey] && styles.checkedButton,
                ]}
                onPress={() => toggleCheck(normalizedKey)}
              >
                <AntDesign
                  name={otherCheckedItems[normalizedKey] ? "check" : "close"}
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="add note..."
                placeholderTextColor="#888"
                value={otherItemNotes[normalizedKey] || ""}
                onChangeText={(text) => handleNoteChange(normalizedKey, text)}
              />
            </View>
          );
        })}
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Other Checklist</Text>
        <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
        <Text style={styles.subText}>Equipment:</Text>
        {otherEquipment.map((item, idx) => (
          <Text key={idx} style={styles.subText}>
            • {item.name}
          </Text>
        ))}
      </View>

      {renderDynamicFields()}

       {otherEquipment && otherEquipment.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={otherNotesInput}
          onChangeText={setOtherNotesInput}
        />
      </View>
    )}

      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={otherNotesInput}
          onChangeText={ setOtherNotesInput}
        />
      </View> */}

      <ChecklistNavigator navigation={navigation} currentStep={4} />
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040F2E",
  },
  header: {
    backgroundColor: "#1F3A93",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subText: {
    fontSize: 16,
    color: "#E0E0E0",
  },
  section: {
    backgroundColor: "#1B2A52",
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00CFFF",
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  itemText: {
    fontSize: 14,
    color: "#E5E5E5",
    flex: 2,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#000",
    flex: 2,
    marginHorizontal: 5,
  },
  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ccc",
  },
  checkedButton: {
    backgroundColor: "green",
    borderColor: "green",
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
    textAlign: "center",
  },
});

export default OtherPage;
