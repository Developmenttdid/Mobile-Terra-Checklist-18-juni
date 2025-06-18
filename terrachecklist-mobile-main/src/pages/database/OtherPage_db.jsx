import { AntDesign, Ionicons  } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
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

const OtherPage_Db = ({ navigation }) => {
  const { projectCode, otherEquipment } = useProject();
  const [loading, setLoading] = useState(true);

  const {
    otherCheckedItems,
    setOtherCheckedItems,
    otherItemNotes,
    setOtherItemNotes,
    otherNotesInput,
    setOtherNotesInput,
    otherDbRows,
    setOtherDbRows,
    isOtherSaving,
    setIsOtherSaving,
    isOtherEdited,
    setIsOtherEdited,
  } = useSaveContext();

  const {
    otherSecondCheckedItems,
    setOtherSecondCheckedItems,
    buttonsDisabled,
    setButtonsDisabled,
  } = useSaveInContext();

  useEffect(() => {
    console.log("otherEquipment from context:", otherEquipment);
  }, [otherEquipment]);

  const normalizeKey = (equip, id) =>
    `${equip}_${id}`.toLowerCase().replace(/\s+/g, "_");

  const fetchDatabaseData = async () => {
    try {
      const res = await fetch("http://103.163.184.111:3000/other_database");
      if (!res.ok) {
        console.error("Error fetching other database:", res.status);
        setOtherDbRows([]);
        return;
      }
      const data = await res.json();
      const filtered = data.filter((row) => row.project_code === projectCode);
      setOtherDbRows(filtered);

      const initialChecked = {};
      const initialNotes = {};

      filtered.forEach((row) => {
        const key = normalizeKey(row.other_equipment, row.equipment_id);
        initialChecked[key] = row.item_1 === "true" || row.item_1 === true;
        initialNotes[key] = row.item_notes || "";
      });

      setOtherCheckedItems(initialChecked);
      setOtherItemNotes(initialNotes);

      if (filtered.length > 0) {
        setOtherNotesInput(filtered[0].notes || "");
      }
    } catch (err) {
      console.error("Error fetching other database:", err);
      setOtherDbRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherSecondCheckboxData = async () => {
    try {
      // Fetch all records from other_database_in
      const response = await fetch(
        "http://103.163.184.111:3000/other_database_in"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch other second checkbox data");
      }

      const allRecords = await response.json();

      // Filter records by projectCode and get the latest record for each equipment
      const filteredRecords = allRecords
        .filter((record) => record.project_code === projectCode)
        .reduce((acc, current) => {
          const key = normalizeKey(
            current.other_equipment,
            current.equipment_id
          );
          // Keep only the record with the highest ID for each equipment
          if (!acc[key] || current.id > acc[key].id) {
            acc[key] = current;
          }
          return acc;
        }, {});

      // Convert the filtered records to checked items state
      const initialSecondCheckedItems = {};
      Object.values(filteredRecords).forEach((record) => {
        const key = normalizeKey(record.other_equipment, record.equipment_id);
        initialSecondCheckedItems[key] =
          record.item_1 === "true" || record.item_1 === true;
      });

      setOtherSecondCheckedItems(initialSecondCheckedItems);
    } catch (error) {
      console.error("Error fetching second checkbox data:", error);
      // Handle error silently or show a message
    }
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     let isActive = true;

  //     const loadData = async () => {
  //       setLoading(true);
  //       try {
  //         if (!isOtherEdited) {
  //           await fetchDatabaseData(); // Fetch only if not edited
  //           await fetchOtherSecondCheckboxData();
  //         }
  //       } catch (error) {
  //         console.error("Error loading data:", error);
  //         if (isActive) {
  //           setOtherDbRows([]);
  //         }
  //       } finally {
  //         if (isActive) {
  //           setLoading(false);
  //         }
  //       }
  //     };

  //     loadData();

  //     return () => {
  //       isActive = false;
  //     };
  //   }, [projectCode, isOtherEdited])
  // );

  useFocusEffect(
  useCallback(() => {
    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load state checkbox kedua dari AsyncStorage
        const savedChecks = await AsyncStorage.getItem(
          `otherSecondChecks_${projectCode}`
        );
        if (savedChecks) {
          setOtherSecondCheckedItems(JSON.parse(savedChecks));
        } else {
          // Fallback jika belum ada di local
          await fetchOtherSecondCheckboxData();
        }

        // Fetch database utama jika belum diedit
        if (!isOtherEdited) {
          await fetchDatabaseData();
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isActive) {
          setOtherDbRows([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [projectCode, isOtherEdited])
);


  const saveOtherSecondCheckboxData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Prepare data array for all items
      const itemsToSave = Object.entries(groupedEquipment).flatMap(
        ([equipName, items]) => {
          return items.map((item) => {
            const key = normalizeKey(equipName, item.id);
            return {
              email: email,
              project_code: projectCode,
              other_equipment: equipName,
              equipment_id: item.id,
              item_1: String(otherSecondCheckedItems[key] || false),
            };
          });
        }
      );

      // Send as array to match server endpoint
      const response = await fetch(
        "http://103.163.184.111:3000/other_database_in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemsToSave),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save data");
      }

      const result = await response.json();
      Alert.alert(
        "Success",
        result.message || "Checkbox data saved successfully"
      );

      // Optional: Update local state if needed
      setOtherSecondCheckedItems((prev) => {
        const newState = { ...prev };
        itemsToSave.forEach((item) => {
          const key = normalizeKey(item.other_equipment, item.equipment_id);
          newState[key] = item.item_1 === "true";
        });
        return newState;
      });
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save checkbox data");
    }
  };

  const toggleCheck = (key) => {
    setOtherCheckedItems((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      if (!isOtherEdited) setIsOtherEdited(true);
      return newState;
    });
  };

  const handleNoteChange = (key, text) => {
    setOtherItemNotes((prev) => {
      const newState = { ...prev, [key]: text };
      if (!isOtherEdited) setIsOtherEdited(true);
      return newState;
    });
  };

  const handleOverallNotesChange = (text) => {
    setOtherNotesInput(text);
    if (!isOtherEdited) setIsOtherEdited(true);
  };

  const toggleSecondCheck = async (key) => {
    const newState = {
      ...otherSecondCheckedItems,
      [key]: !otherSecondCheckedItems[key],
    };
    setOtherSecondCheckedItems(newState);

    // Simpan ke AsyncStorage
    try {
      await AsyncStorage.setItem(
        `otherSecondChecks_${projectCode}`,
        JSON.stringify(newState)
      );
    } catch (error) {
      console.error("Gagal menyimpan state checkbox:", error);
    }
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     let isActive = true;

  //     const loadData = async () => {
  //       setLoading(true);
  //       try {
  //         // Load state checkbox kedua
  //         const savedChecks = await AsyncStorage.getItem(
  //           `otherSecondChecks_${projectCode}`
  //         );
  //         if (savedChecks) {
  //           setOtherSecondCheckedItems(JSON.parse(savedChecks));
  //         }

  //         if (!isOtherEdited) {
  //           await fetchDatabaseData();
  //         }
  //       } catch (error) {
  //         console.error("Error loading data:", error);
  //         if (isActive) {
  //           setOtherDbRows([]);
  //         }
  //       } finally {
  //         if (isActive) {
  //           setLoading(false);
  //         }
  //       }
  //     };

  //     loadData();

  //     return () => {
  //       isActive = false;
  //     };
  //   }, [projectCode, isOtherEdited])
  // );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CFFF" />
      </View>
    );
  }

  if (otherDbRows.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Other Checklist</Text>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
        </View>
        <Text style={styles.notFoundText}>No Other items found.</Text>
        <ChecklistNavigator navigation={navigation} currentStep={4} />
      </ScrollView>
    );
  }

  const groupedEquipment = otherEquipment.reduce((acc, item) => {
    const name = item.name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(item);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Other Checklist</Text>
        <Text style={styles.subText}>Project: {projectCode}</Text>
        <Text style={styles.subText}>Equipment:</Text>
        {otherEquipment.map((item, idx) => (
          <Text key={idx} style={styles.subText}>
            • {item.name}
          </Text>
        ))}
      </View>

      {Object.entries(groupedEquipment).map(([equipName, items]) => (
        <View key={equipName} style={styles.section}>
          <Text style={styles.sectionTitle}>{`${equipName}`}</Text>
          {items.map((item) => {
            const { id: equipmentId } = item;
            const key = normalizeKey(equipName, equipmentId);
            const checked = otherCheckedItems[key];
            const note = otherItemNotes[key] || "";
            return (
              <View key={equipmentId} style={styles.itemContainer}>
                <Text style={styles.itemText}>{equipmentId}</Text>

                {/* <TouchableOpacity
                  onPress={() => toggleCheck(key)}
                  style={[styles.checkButton, checked && styles.checkedButton]}
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
                      otherCheckedItems[key] && styles.checkedButton,
                    ]}
                  >
                    {otherCheckedItems[key] && (
                      <Ionicons  name="checkmark" size={20} color="white" />
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => toggleCheck(key)}
                    style={[
                      styles.checkButton,
                      checked && styles.checkedButton,
                    ]}
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
                    otherSecondCheckedItems[key] && styles.checkedButton,
                  ]}
                  onPress={() => toggleSecondCheck(key)}
                >
                  {otherSecondCheckedItems[key] && (
                    <AntDesign name="check" size={20} color="white" />
                  )}
                </TouchableOpacity> */}

                {/* Checkbox Kedua (In) */}
                {buttonsDisabled ? (
                  <View
                    style={[
                      styles.checkButton,
                      { marginStart: 10 },
                      (otherSecondCheckedItems[key] || false) &&
                        styles.checkedButtonIn,
                    ]}
                  >
                    {(otherSecondCheckedItems[key] || false) && (
                      <Ionicons  name="checkmark" size={20} color="white" />
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      { marginStart: 10 },
                      otherSecondCheckedItems[key] && styles.checkedButtonIn,
                    ]}
                    onPress={() => toggleSecondCheck(key)}
                  >
                    {otherSecondCheckedItems[key] && (
                      <Ionicons  name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                )}

                {/* <TextInput
                  style={styles.input}
                  placeholder="Notes..."
                  value={note}
                  onChangeText={(text) => handleNoteChange(key, text)}
                  multiline
                /> */}

                <TextInput
                  style={styles.input}
                  placeholder="Add note..."
                  placeholderTextColor="#888"
                  value={note}
                  onChangeText={(text) => handleNoteChange(key, text)}
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
          value={otherNotesInput}
          onChangeText={handleOverallNotesChange}
        /> */}
        <TextInput
          style={[styles.input, buttonsDisabled && styles.disabledField]}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={otherNotesInput}
          onChangeText={handleOverallNotesChange}
          editable={!buttonsDisabled}
          multiline
        />
      </View>

      <ChecklistNavigator navigation={navigation} currentStep={4} />
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
    marginVertical: 8,
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

  smallSaveButton: {
    backgroundColor: "#00CFFF",
    padding: 8,
    borderRadius: 6,
    alignSelf: "flex-end",
    marginTop: 10,
    width: 80,
    alignItems: "center",
  },
  smallSaveButtonText: {
    color: "#040F2E",
    fontSize: 14,
    fontWeight: "600",
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
  checkedButtonIn: {
    backgroundColor: "#FF9800",
    borderColor: "#F57C00",
  },
});

export default OtherPage_Db;




