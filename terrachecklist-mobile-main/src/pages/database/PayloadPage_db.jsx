import { AntDesign, Ionicons  } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChecklistNavigator from "../../components/ChecklistNav_db";
import { useProject } from "../ProjectContext";
import { useSaveContext } from "./SaveContext";
import { useSaveInContext } from "./SaveInContext";

const PayloadPage_Db = ({ navigation }) => {
  const { projectCode, payloadEquipment } = useProject();

  const [loading, setLoading] = useState(true);
  const [idMap, setIdMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState("");

  const {
    payloadCheckedItems,
    setPayloadCheckedItems,
    payloadItemNotes,
    setPayloadItemNotes,
    payloadNotesInput,
    setPayloadNotesInput,
    payloadChecklistData,
    setPayloadChecklistData,
    isPayloadSaving,
    setIsPayloadSaving,
    isPayloadEdited,
    setIsPayloadEdited,
  } = useSaveContext();

  const {
    payloadSecondCheckedItems,
    setPayloadSecondCheckedItems,
    buttonsDisabled,
    setButtonsDisabled,
  } = useSaveInContext();

  const normalizeKey = (str) => str.toLowerCase().replace(/\s+/g, "_");

  // Fetch item templates
  const fetchChecklistTemplate = async () => {
    try {
      const res = await fetch("http://103.163.184.111:3000/payload_checklist");
      const data = await res.json();
      const matched = data.filter((item) =>
        payloadEquipment.includes(item.payload_name)
      );
      setPayloadChecklistData(matched);
    } catch (error) {
      console.error("Error fetching Payload checklist:", error);
    }
  };

  // Fetch initial data from DB
  const fetchDatabaseData = async () => {
    try {
      //const res = await fetch('http://103.163.184.111:3000/gps_database');
      const res = await fetch(
        "http://103.163.184.111:3000/payload_database?" +
          new URLSearchParams({
            project_code: projectCode,
            _: Date.now(), // Cache buster
          })
      );

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const filtered = data.filter(
        (row) =>
          row.project_code === projectCode &&
          payloadEquipment.includes(row.payload_name)
      );
      if (filtered.length === 0) return;
      const latestByName = {};
      filtered.forEach((row) => {
        if (
          !latestByName[row.payload_name] ||
          row.id > latestByName[row.payload_name].id
        ) {
          latestByName[row.payload_name] = row;
        }
      });
      const latestList = Object.values(latestByName);

      const initChecked = {};
      const initNotes = {};
      let overall = "";
      latestList.forEach((row) => {
        const prefix = row.payload_name;
        Object.entries(row).forEach(([key, value]) => {
          if (key.startsWith("item_") && !key.endsWith("_notes")) {
            initChecked[normalizeKey(`${prefix}_${key}`)] =
              value === true || value === "true";
          }
          if (key.startsWith("item_") && key.endsWith("_notes")) {
            const base = key.replace(/_notes$/, "");
            initNotes[normalizeKey(`${prefix}_${base}`)] = value || "";
          }
          if (key === "notes") {
            overall = value || "";
          }
        });
      });

      setPayloadCheckedItems(initChecked);
      setPayloadItemNotes(initNotes);
      setPayloadNotesInput(overall);
    } catch (error) {
      console.error("Error fetching Payload database:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayloadSecondCheckboxData = async () => {
    try {
      const response = await fetch(
        `http://103.163.184.111:3000/payload_database_in?project_code=${projectCode}`
      );

      if (!response.ok)
        throw new Error("Failed to fetch payload second checkbox data");

      const data = await response.json();

      // Filter by current project code and get the latest record for each payload_name
      const filteredData = data
        .filter((row) => row.project_code === projectCode)
        .sort((a, b) => b.id - a.id); // Sort by ID descending

      const latestRecords = {};
      filteredData.forEach((row) => {
        if (
          !latestRecords[row.payload_name] ||
          row.id > latestRecords[row.payload_name].id
        ) {
          latestRecords[row.payload_name] = row;
        }
      });

      // Initialize checked items state
      const newCheckedItems = {};

      // Process each payload section
      payloadChecklistData.forEach((payload) => {
        const payloadName = payload.payload_name;
        const record = latestRecords[payloadName];

        if (record) {
          // Find all item fields in the record
          Object.keys(record).forEach((key) => {
            if (key.startsWith("item_")) {
              const mapKey = normalizeKey(`${payloadName}_${key}`);
              newCheckedItems[mapKey] =
                record[key] === "true" || record[key] === true;
            }
          });
        }
      });

      // Update the state with fetched data
      setPayloadSecondCheckedItems((prev) => ({
        ...prev,
        ...newCheckedItems,
      }));

      return latestRecords;
    } catch (error) {
      console.error("Error fetching payload second checkbox data:", error);
      throw error;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      const loadData = async () => {
        await fetchChecklistTemplate();
        await fetchPayloadSecondCheckboxData();

        if (!isPayloadEdited) {
          await fetchDatabaseData();
        } else {
          // If edited, just set loading to false without fetching
          setLoading(false);
        }
      };

      loadData();

      return () => {
        // Cleanup if needed
      };
    }, [projectCode, isPayloadEdited])
  );

  const savePayloadSecondCheckboxData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Prepare data for each Payload section
      const payloads = payloadChecklistData.map((payload) => {
        // Get all valid items for this Payload section
        const validItems = Object.keys(payload).filter(
          (key) => key.startsWith("item_") && payload[key]
        );

        // Create payload with dynamic items
        const payloadData = {
          email: email,
          project_code: projectCode,
          payload_name: payload.payload_name, // Menggunakan payload_name sebagai nama card
        };

        // Add checkbox values for each existing item
        validItems.forEach((key, index) => {
          const mapKey = normalizeKey(`${payload.payload_name}_${key}`);
          payloadData[`item_${index + 1}`] = String(
            payloadSecondCheckedItems[mapKey] || "false"
          );
        });

        return payloadData;
      });

      // Send requests
      const results = await Promise.all(
        payloads.map((payload) =>
          fetch("http://103.163.184.111:3000/payload_database_in", {
            // Menggunakan endpoint payload
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }).then((response) => {
            if (!response.ok) {
              return response.json().then((err) => Promise.reject(err));
            }
            return response.json();
          })
        )
      );

      Alert.alert("Success", "All checkbox data saved successfully");
      return results;
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save checkbox data");
      throw error;
    }
  };

  const toggleCheck = (key) => {
    setPayloadCheckedItems((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      if (!isPayloadEdited) setIsPayloadEdited(true);
      return newState;
    });
  };

  const handleNoteChange = (key, text) => {
    setPayloadItemNotes((prev) => {
      const newState = { ...prev, [key]: text };
      if (!isPayloadEdited) setIsPayloadEdited(true);
      return newState;
    });
  };

  const handleOverallNotesChange = (text) => {
    setPayloadNotesInput(text);
    if (!isPayloadEdited) setIsPayloadEdited(true);
  };

  const toggleSecondCheck = async (mapKey) => {
    const newState = {
      ...payloadSecondCheckedItems,
      [mapKey]: !payloadSecondCheckedItems[mapKey],
    };

    setPayloadSecondCheckedItems(newState);

    try {
      await AsyncStorage.setItem(
        `payloadSecondChecks_${projectCode}`,
        JSON.stringify(newState)
      );
    } catch (error) {
      console.error("Failed to save checkbox state:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      const loadData = async () => {
        try {
          // 1. Pertama, load template checklist
          await fetchChecklistTemplate();

          // 2. Kemudian load data yang tersimpan
          const savedChecks = await AsyncStorage.getItem(
            `payloadSecondChecks_${projectCode}`
          );

          if (savedChecks) {
            const parsedChecks = JSON.parse(savedChecks);

            // Buat state awal berdasarkan template
            const initialChecks = {};

            payloadChecklistData.forEach((payload) => {
              Object.keys(payload)
                .filter((key) => key.startsWith("item_") && payload[key])
                .forEach((key) => {
                  const mapKey = normalizeKey(`${payload.payload_name}_${key}`);
                  initialChecks[mapKey] = parsedChecks[mapKey] || false;
                });
            });

            setPayloadSecondCheckedItems(initialChecks);
          }

          // 3. Terakhir, load data dari database jika belum di-edit
          if (!isPayloadEdited) {
            await fetchDatabaseData();
          }
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setLoading(false);
        }
      };

      loadData();

      return () => {
        // Cleanup
      };
    }, [projectCode, isPayloadEdited, payloadChecklistData.length])
  ); // Tambahkan dependency length

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CFFF" />
      </View>
    );
  }

  if (payloadChecklistData.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Payload Checklist</Text>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
          <Text style={styles.subText}>
            Equipment: {payloadEquipment.join(", ") || "N/A"}
          </Text>
        </View>
        <Text style={styles.notFoundText}>
          Payload for {payloadEquipment.join(", ") || "N/A"} Not Found
        </Text>
        <ChecklistNavigator navigation={navigation} currentStep={1} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Payload Checklist</Text>
        <Text style={styles.subText}>Project: {projectCode}</Text>
        <Text style={styles.subText}>Equipment:</Text>
        {payloadEquipment.map((name, idx) => (
          <Text key={idx} style={styles.subText}>
            • {name}
          </Text>
        ))}
      </View>

      {payloadChecklistData.map((payload, idx) => (
        <View key={idx} style={styles.section}>
          <Text style={styles.sectionTitle}>{`${payload.payload_name}`}</Text>
          {Object.keys(payload)
            .filter((key) => key.startsWith("item_") && payload[key])
            .map((key) => {
              const label = payload[key];
              const mapKey = normalizeKey(`${payload.payload_name}_${key}`);
              const checked = payloadCheckedItems[mapKey];
              const note = payloadItemNotes[mapKey] || "";
              return (
                <View key={key} style={styles.itemContainer}>
                  <Text style={styles.itemText}>{label}</Text>
                  {/* <TouchableOpacity
                    style={[
                      styles.checkButton,
                      checked && styles.checkedButton,
                    ]}
                    onPress={() => toggleCheck(mapKey)}
                  >
                    {checked && (
                      <AntDesign name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity> */}

                  {/* Checkbox Pertama (Out) */}
                  {buttonsDisabled ? (
                    <View
                      style={[
                        styles.checkButton,
                        payloadCheckedItems[mapKey] && styles.checkedButton,
                      ]}
                    >
                      {payloadCheckedItems[mapKey] && (
                        <Ionicons  name="checkmark" size={20} color="white" />
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.checkButton,
                        checked && styles.checkedButton,
                      ]}
                      onPress={() => toggleCheck(mapKey)}
                    >
                      {checked && (
                        <Ionicons  name="checkmark" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* checkbox kedua/checkbox baru */}
                  {/* <TouchableOpacity
                    style={[
                      styles.checkButton,
                      { marginStart: 10 },
                      payloadSecondCheckedItems[mapKey] && styles.checkedButton,
                    ]}
                    onPress={() => toggleSecondCheck(mapKey)}
                  >
                    {payloadSecondCheckedItems[mapKey] && (
                      <AntDesign name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity> */}

                  {/* Checkbox Kedua (In) */}
                  {buttonsDisabled ? (
                    <View
                      style={[
                        styles.checkButton,
                        { marginStart: 10 },
                        (payloadSecondCheckedItems[mapKey] || false) &&
                          styles.checkedButtonIn,
                      ]}
                    >
                      {(payloadSecondCheckedItems[mapKey] || false) && (
                        <Ionicons  name="checkmark" size={20} color="white" />
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.checkButton,
                        { marginStart: 10 },
                        payloadSecondCheckedItems[mapKey] &&
                          styles.checkedButtonIn,
                      ]}
                      onPress={() => toggleSecondCheck(mapKey)}
                    >
                      {payloadSecondCheckedItems[mapKey] && (
                        <Ionicons  name="checkmark" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* <TextInput
                    style={styles.input}
                    placeholder="Add note..."
                    placeholderTextColor="#888"
                    value={note}
                    onChangeText={(text) => handleNoteChange(mapKey, text)}
                  /> */}

                  <TextInput
                    style={styles.input}
                    placeholder="Add note..."
                    placeholderTextColor="#888"
                    value={note}
                    onChangeText={(text) => handleNoteChange(mapKey, text)}
                    editable={!buttonsDisabled}
                  
                  />
                </View>
              );
            })}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        {/* <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={payloadNotesInput}
          onChangeText={handleOverallNotesChange}
        /> */}
        <TextInput
          style={[styles.input, buttonsDisabled]}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={payloadNotesInput}
          onChangeText={handleOverallNotesChange}
          editable={!buttonsDisabled}
        />
      </View>

      <ChecklistNavigator navigation={navigation} currentStep={1} />
      <View style={{ height: 100, width: "100%" }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040F2E" },
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
  subText: { fontSize: 16, color: "#E0E0E0" },
  notFoundText: { textAlign: "center", marginTop: 20, color: "#E5E5E5" },
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
  itemText: { fontSize: 14, color: "#E5E5E5", flex: 2 },
  checkButton: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  checkedButton: { backgroundColor: "green", borderColor: "green" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#000",
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#00CFFF",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#040F2E",
    fontSize: 18,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#00CFFF",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00CFFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  checkedButtonOut: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  checkedButtonIn: {
    backgroundColor: "#FF9800",
    borderColor: "#F57C00",
  },
  //   disabledField: {
  //   backgroundColor: '#f5f5f5',
  //   borderColor: '#e0e0e0',
  //   color: '#888'
  // }
});

export default PayloadPage_Db;





