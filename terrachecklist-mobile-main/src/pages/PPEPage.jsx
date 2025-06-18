import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { usePPE } from "./PPEContext";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChecklistNavigator from "../components/ChecklistNav";
import { useProject } from "./ProjectContext"; // Import useProject from the correct file

const PPEPage = ({ navigation }) => {
  const { projectCode, ppeName, ppeCheckedItems, setPpeCheckedItems, ppeItemNotes, setPpeItemNotes, ppeNotesInput, setPpeNotesInput } = useProject(); // Access ppeName from ProjectContext
  const [checklistData, setChecklistData] = useState(null); // Use `null` to differentiate between no data and empty data
  const [loading, setLoading] = useState(true);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const { setHandleSubmitPPE } = usePPE();

  // Function to load saved data from AsyncStorage
  const loadSavedData = async () => {
    try {
      const savedCheckedItems = await AsyncStorage.getItem("ppeCheckedItems");
      const savedItemNotes = await AsyncStorage.getItem("ppeItemNotes");
      const savedNotesInput = await AsyncStorage.getItem("ppeNotesInput");
      const savedEvidenceFile = await AsyncStorage.getItem("ppeEvidenceFile");

      if (savedCheckedItems) setPpeCheckedItems(JSON.parse(savedCheckedItems));
      if (savedItemNotes) setPpeItemNotes(JSON.parse(savedItemNotes));
      if (savedNotesInput) setPpeNotesInput (savedNotesInput);
      if (savedEvidenceFile) setEvidenceFile(JSON.parse(savedEvidenceFile));
    } catch (error) {
      console.log("Error loading saved data:", error);
    }
  };

  // Load saved data when the page gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadSavedData();
    }, [])
  );

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          "ppeCheckedItems",
          JSON.stringify(ppeCheckedItems)
        );
        await AsyncStorage.setItem("ppeItemNotes", JSON.stringify(ppeItemNotes));
        await AsyncStorage.setItem("ppeNotesInput", ppeNotesInput);
        await AsyncStorage.setItem(
          "ppeEvidenceFile",
          JSON.stringify(evidenceFile)
        );
      } catch (error) {
        console.log("Error saving data:", error);
      }
    };

    saveData();
  }, [ppeCheckedItems, ppeItemNotes, ppeNotesInput, evidenceFile]);

  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
      //  console.log("Fetching checklist data for ppeName:", ppeName); // Debugging log
        const response = await fetch(
          "http://103.163.184.111:3000/ppe_checklist"
        );
        const data = await response.json();

        // Filter all PPE items that match the ppeName array
        const matchedPPE = data.filter((item) =>
          ppeName.includes(item.ppe_name)
        );
      //  console.log("Matched checklist data:", matchedPPE); // Debugging log

        setChecklistData(matchedPPE || []); // Store as an array of PPE items
      } catch (error) {
        console.log("Error fetching checklist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklistData();
  }, [ppeName]);

  // useEffect(() => {
  //   if (checklistData && projectCode) {
  //     setHandleSubmitPPE(() => handleSubmit);
  //   }
  // }, [checklistData, checkedItems, projectCode]);

  useEffect(() => {
    const submitFunction = async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        if (!email) {
          Alert.alert("Error", "User email not found.");
          return;
        }
  
        const submissions = checklistData.map((ppe) => {
          const ppeTitle = ppe.ppe_name;
          const itemKey = Object.keys(ppe).find(
            (key) => key.startsWith("item_") && ppe[key] !== null && ppe[key] !== ""
          );
          const itemName = ppe[itemKey];
          const fullKey = normalizeKey(`${ppeTitle}_${itemName}`);
          const isChecked = ppeCheckedItems[fullKey] === true;
  
          return {
            email,
            ppe_name: ppeTitle,
            item_1: isChecked ? "true" : "false",
            project_code: projectCode,
            item_notes: ppeItemNotes[fullKey] || "",
            notes: ppeNotesInput || "",
          };
        });
  
        for (const data of submissions) {
          const response = await fetch("http://103.163.184.111:3000/ppe_database", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
  
          const responseText = await response.text();
          if (!response.ok) {
            console.log("❌ Server responded with:", response.status, responseText);
            throw new Error(`Failed to submit data for ${data.ppe_name}`);
          }
        }
  
        // Alert.alert("Success", "Checklist successfully submitted.");
      } catch (error) {
        console.log("Submit error:", error);
        Alert.alert("Error", "An error occurred while submitting the checklist.");
      }
    };
  
    if (checklistData && projectCode) {
      setHandleSubmitPPE(() => submitFunction);
    }
  }, [checklistData, ppeCheckedItems, ppeItemNotes, ppeNotesInput, projectCode]);
  
  

  const normalizeKey = (key) => key.toLowerCase().replace(/ /g, "_");

  const toggleCheck = (itemKey) => {
    const normalizedKey = normalizeKey(itemKey);
    setPpeCheckedItems((prevState) => ({
      ...prevState,
      [normalizedKey]: !prevState[normalizedKey], // Toggle the checked state
    }));
  };

  const handleNoteChange = (itemKey, text) => {
    const normalizedKey = normalizeKey(itemKey);
    setPpeItemNotes((prevState) => ({
      ...prevState,
      [normalizedKey]: text, // Update the note for the specific item
    }));
  };

  const handleSelectEvidence = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant camera roll permission to upload evidence."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setEvidenceFile(result.assets[0]);
    }
  };

  const handleDeleteEvidence = () => {
    setEvidenceFile(null);
  };

  const renderDynamicFields = () => {
    if (!checklistData || checklistData.length === 0) return null;

    return checklistData.map((ppe, ppeIndex) => {
      // Extract all fields that start with "item_" and are not null
      const fields = Object.keys(ppe)
        .filter((key) => key.startsWith("item_") && ppe[key] !== null)
        .map((key) => ppe[key])
        .filter((item) => item !== "");

      if (fields.length === 0) return null;

      // Use the PPE name as the title
      const ppeTitle = ppe.ppe_name || `PPE ${ppeIndex + 1}`;

      return (
        <View key={ppeIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{`PPE - ${ppeTitle}`}</Text>
          {fields.map((item, index) => {
            // Create a unique key for each item using the PPE name and item name
            const uniqueKey = `${ppeTitle}_${item}`;
            const normalizedKey = normalizeKey(uniqueKey);

            return (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>{item}</Text>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    ppeCheckedItems[normalizedKey] && styles.checkedButton,
                  ]}
                  onPress={() => toggleCheck(normalizedKey)}
                >
                  <AntDesign
                    name={ppeCheckedItems[normalizedKey] ? "check" : "close"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="add note..."
                  placeholderTextColor="#888"
                  value={ppeItemNotes[normalizedKey] || ""}
                  onChangeText={(text) => handleNoteChange(normalizedKey, text)}
                />
              </View>
            );
          })}
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CFFF" />
      </View>
    );
  }

  if (!checklistData || checklistData.length === 0) {
    // Show "PPE Not Found" page if no data is found
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>PPE Checklist</Text>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
          <Text style={styles.subText}>Equipment: {ppeName || "N/A"}</Text>
        </View>
        <Text style={styles.notFoundText}>
          PPE for {ppeName || "N/A"} Not Found
        </Text>
        <ChecklistNavigator navigation={navigation} currentStep={3} />
      </ScrollView>
    );
  }

  const handleSubmit = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) {
        Alert.alert("Error", "User email not found.");
        return;
      }

      const submissions = checklistData.map((ppe) => {
        const ppeTitle = ppe.ppe_name;

        // Ambil item tunggal (karena cuma ada 1 item per card)
        const itemKey = Object.keys(ppe).find(
          (key) =>
            key.startsWith("item_") && ppe[key] !== null && ppe[key] !== ""
        );
        const itemName = ppe[itemKey]; // misalnya "Sarung tangan"

        const fullKey = normalizeKey(`${ppeTitle}_${itemName}`); // sama kayak waktu render checkbox

        const isChecked = ppeCheckedItems[fullKey] === true;

        return {
          email,
          ppe_name: ppeTitle,
          item_1: isChecked ? "true" : "false", // langsung masukin true/false sesuai checkbox
          project_code: projectCode,
          item_notes: ppeItemNotes[fullKey] || "",
  notes: ppeNotesInput || "",
        };
      });

   //   console.log("Submissions: ", submissions);

      if (!checklistData || checklistData.length === 0) {
        Alert.alert("Error", "No checklist data available.");
        return;
      }

      for (const data of submissions) {
        const response = await fetch(
          "http://103.163.184.111:3000/ppe_database",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        const responseText = await response.text(); // <--- Tambahan penting

        if (!response.ok) {
          console.log(
            "❌ Server responded with:",
            response.status,
            responseText
          );
          throw new Error(`Failed to submit data for ${data.ppe_name}`);
        }
      }

   //   Alert.alert("Success", "Checklist successfully submitted.");
    } catch (error) {
      console.log("Submit error:", error);
      Alert.alert("Error", "An error occurred while submitting the checklist.");
    }
  };
 
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PPE Checklist</Text>
        <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
        <Text style={styles.subText}>Equipment:</Text>
        {ppeName && ppeName.length > 0 ? (
          ppeName.map((ppe, index) => (
            <Text key={index} style={styles.subText}>
              • {ppe}
            </Text>
          ))
        ) : (
          <Text style={styles.subText}>N/A</Text>
        )}
      </View>

      {renderDynamicFields()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={ppeNotesInput}
          onChangeText={setPpeNotesInput }
        />
      </View>


      <ChecklistNavigator navigation={navigation} currentStep={3} />
      <View style={{ height: 100, width: "100%" }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040F2E",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#040F2E",
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "space-between",
    marginVertical: 15,
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
    flex: 1,
    marginHorizontal: 5,
  },
  checkButton: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkedButton: {
    backgroundColor: "green",
    borderColor: "green",
  },
  evidenceContainer: {
    position: "relative",
    alignItems: "center",
  },
  evidenceImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 5,
  },
  uploadButton: {
    backgroundColor: "#00CFFF",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#00CFFF",
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default PPEPage;

