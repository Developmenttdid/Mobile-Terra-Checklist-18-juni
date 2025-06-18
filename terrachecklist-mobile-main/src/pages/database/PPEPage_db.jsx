import { AntDesign, Ionicons  } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
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

const PPEPage_Db = ({ navigation }) => {
  const { projectCode, ppeName } = useProject();
  const [loading, setLoading] = useState(true);

  const {
    ppeCheckedItems,
    setPpeCheckedItems,
    ppeItemNotes,
    setPpeItemNotes,
    ppeNotesInput,
    setPpeNotesInput,
    isPpeSaving,
    setIsPpeSaving,
    isPpeEdited,
    setIsPpeEdited,
    dbRows,
    setDbRows,
  } = useSaveContext();

  const {
    ppeSecondCheckedItems,
    setPpeSecondCheckedItems,
    buttonsDisabled,
    setButtonsDisabled,
  } = useSaveInContext();

  const normalizeKey = (ppeName) => ppeName.toLowerCase().replace(/\s+/g, "_");

  const fetchDatabaseData = async (overwrite = true) => {
    try {
      const res = await fetch("http://103.163.184.111:3000/ppe_database");
      if (!res.ok) {
        console.error("Error fetching PPE database:", res.status);
        setDbRows([]);
        return;
      }

      const data = await res.json();
      const filtered = data.filter(
        (row) =>
          row.project_code === projectCode && ppeName.includes(row.ppe_name)
      );
      setDbRows(filtered);

      if (overwrite) {
        const initialChecked = {};
        const initialNotes = {};

        filtered.forEach((row) => {
          const key = normalizeKey(row.ppe_name);
          initialChecked[key] = row.item_1 === "true" || row.item_1 === true;
          initialNotes[key] = row.item_notes || "";
        });

        setPpeCheckedItems(initialChecked);
        setPpeItemNotes(initialNotes);

        if (filtered.length > 0) {
          setPpeNotesInput(filtered[0].notes || "");
        }
      }
    } catch (err) {
      console.error("Error fetching PPE database:", err);
      setDbRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePpeSave = async () => {
    setIsPpeSaving(true);
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Prepare data for saving
      const saveData = dbRows.map((row) => {
        const key = normalizeKey(row.ppe_name);
        return {
          id: row.id, // Include the specific ID of the PPE item
          project_code: projectCode,
          ppe_name: row.ppe_name,
          item_1: String(ppeCheckedItems[key] || false),
          item_notes: ppeItemNotes[key] || "",
          notes: ppeNotesInput,
          timestamp: new Date().toISOString(),
          email: email,
        };
      });

      // Save each item by its specific ID
      for (const data of saveData) {
        if (data.id) {
          // Update existing PPE item
          const response = await fetch(
            `http://103.163.184.111:3000/ppe_database/${data.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to update PPE item with ID: ${data.id}`);
          }
        } else {
          // Handle cases where the item does not have an ID (optional)
          console.warn(`No ID found for PPE item: ${data.ppe_name}`);
        }
      }

      Alert.alert("Data PPE berhasil diupdate");
      fetchDatabaseData(); // Refresh data
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save PPE data");
    } finally {
      setIsPpeSaving(false);
    }
  };

  const fetchPpeSecondCheckboxData = async () => {
    try {
      // Fetch all records from ppe_database_in
      const response = await fetch(
        "http://103.163.184.111:3000/ppe_database_in"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch PPE second checkbox data");
      }

      const allRecords = await response.json();

      // Filter records by projectCode and get the latest record for each PPE item
      const filteredRecords = allRecords
        .filter((record) => record.project_code === projectCode)
        .reduce((acc, current) => {
          const key = normalizeKey(current.ppe_name);
          // Keep only the record with the highest ID for each PPE item
          if (!acc[key] || current.id > acc[key].id) {
            acc[key] = current;
          }
          return acc;
        }, {});

      // Convert the filtered records to checked items state
      const initialSecondCheckedItems = {};
      Object.values(filteredRecords).forEach((record) => {
        const key = normalizeKey(record.ppe_name);
        initialSecondCheckedItems[key] =
          record.item_1 === "true" || record.item_1 === true;
      });

      setPpeSecondCheckedItems(initialSecondCheckedItems);
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
  //         await fetchDatabaseData(!isPpeEdited); // overwrite hanya kalau belum diedit
  //         // Fetch second checkbox data from server
  //         await fetchPpeSecondCheckboxData();
  //       } catch (error) {
  //         console.error("Error loading data:", error);
  //         if (isActive) {
  //           setDbRows([]);
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
  //   }, [projectCode, ppeName, isPpeEdited])
  // );

  useFocusEffect(
  useCallback(() => {
    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load state checkbox kedua dari AsyncStorage lebih dulu
        const savedChecks = await AsyncStorage.getItem(
          `ppeSecondChecks_${projectCode}`
        );

        if (savedChecks) {
          setPpeSecondCheckedItems(JSON.parse(savedChecks));
        } else {
          // Hanya fetch dari server kalau belum ada di AsyncStorage
          await fetchPpeSecondCheckboxData();
        }

        // Load data utama
        if (!isPpeEdited) {
          await fetchDatabaseData(true); // overwrite true karena belum di-edit
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isActive) {
          setDbRows([]);
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
  }, [projectCode, ppeName, isPpeEdited])
);


  const savePpeSecondCheckboxData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Prepare and save data for each PPE item
      await Promise.all(
        ppeName.map(async (equipName) => {
          const key = normalizeKey(equipName);
          const isChecked = ppeSecondCheckedItems[key] || false;

          const data = {
            email: email,
            ppe_name: equipName, // card title goes here
            project_code: projectCode,
            item_1: String(isChecked), // convert boolean to string
          };

          const response = await fetch(
            "http://103.163.184.111:3000/ppe_database_in",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to save data for ${equipName}`);
          }

          return response.json();
        })
      );

      Alert.alert("Success", "Second checkbox data saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save second checkbox data"
      );
    }
  };

  const toggleCheck = (key) => {
    setPpeCheckedItems((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      if (!isPpeEdited) setIsPpeEdited(true);
      return newState;
    });
  };

  const handleNoteChange = (key, text) => {
    setPpeItemNotes((prev) => {
      const newState = { ...prev, [key]: text };
      if (!isPpeEdited) setIsPpeEdited(true);
      return newState;
    });
  };

  const handleOverallNotesChange = (text) => {
    setPpeNotesInput(text);
    if (!isPpeEdited) setIsPpeEdited(true);
  };

  const toggleSecondCheck = async (key) => {
    const newState = {
      ...ppeSecondCheckedItems,
      [key]: !ppeSecondCheckedItems[key],
    };
    setPpeSecondCheckedItems(newState);

    // Simpan ke AsyncStorage
    try {
      await AsyncStorage.setItem(
        `ppeSecondChecks_${projectCode}`,
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
  //           `ppeSecondChecks_${projectCode}`
  //         );
  //         if (savedChecks) {
  //           setPpeSecondCheckedItems(JSON.parse(savedChecks));
  //         }

  //         if (!isPpeEdited) {
  //           await fetchDatabaseData();
  //         }
  //       } catch (error) {
  //         console.error("Error loading data:", error);
  //         if (isActive) {
  //           setDbRows([]);
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
  //   }, [projectCode, isPpeEdited])
  // );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CFFF" />
      </View>
    );
  }

  if (dbRows.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>PPE Checklist</Text>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
          <Text style={styles.subText}>
            Equipment: {ppeName.join(", ") || "N/A"}
          </Text>
        </View>
        <Text style={styles.notFoundText}>
          No PPE data found for this project.
        </Text>
        <ChecklistNavigator navigation={navigation} currentStep={3} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PPE Checklist</Text>
        <Text style={styles.subText}>Project: {projectCode}</Text>
        <Text style={styles.subText}>Equipment:</Text>
        {ppeName.map((name, idx) => (
          <Text key={idx} style={styles.subText}>
            • {name}
          </Text>
        ))}
      </View>

      {ppeName.map((equipName) => {
        const key = normalizeKey(equipName);
        const checked = ppeCheckedItems[key];
        const note = ppeItemNotes[key] || "";
        const ppeData = dbRows.find((row) => row.ppe_name === equipName);

        if (!ppeData) return null;

        return (
          <View key={equipName} style={styles.section}>
            <Text style={styles.sectionTitle}>{`${equipName}`}</Text>
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>Check condition</Text>

              {/* <TouchableOpacity
                style={[styles.checkButton, checked && styles.checkedButton]}
                onPress={() => toggleCheck(key)}
              >
                {checked && <AntDesign name="check" size={20} color="white" />}
              </TouchableOpacity> */}

              {/* Checkbox Pertama (Out) */}
              {buttonsDisabled ? (
                <View
                  style={[
                    styles.checkButton,
                    ppeCheckedItems[key] && styles.checkedButton,
                  ]}
                >
                  {ppeCheckedItems[key] && (
                    <Ionicons  name="checkmark" size={20} color="white" />
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.checkButton, checked && styles.checkedButton]}
                  onPress={() => toggleCheck(key)}
                >
                  {checked && (
                    <Ionicons  name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
              )}

              {/* checkbox baru yaitu checkbox kedua */}
              {/* <TouchableOpacity
                style={[
                  styles.checkButton,
                  { marginStart: 10 },
                  ppeSecondCheckedItems[key] && styles.checkedButton,
                ]}
                onPress={() => toggleSecondCheck(key)}
              >
                {ppeSecondCheckedItems[key] && (
                  <AntDesign name="check" size={20} color="white" />
                )}
              </TouchableOpacity> */}

              {/* Checkbox Kedua (In) */}
              {buttonsDisabled ? (
                <View
                  style={[
                    styles.checkButton,
                    { marginStart: 10 },
                    (ppeSecondCheckedItems[key] || false) &&
                      styles.checkedButtonIn,
                  ]}
                >
                  {(ppeSecondCheckedItems[key] || false) && (
                    <Ionicons  name="checkmark" size={20} color="white" />
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    { marginStart: 10 },
                    ppeSecondCheckedItems[key] && styles.checkedButtonIn,
                  ]}
                  onPress={() => toggleSecondCheck(key)}
                >
                  {ppeSecondCheckedItems[key] && (
                    <Ionicons  name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
              )}

              {/* <TextInput
                style={styles.input}
                placeholder="Add note..."
                placeholderTextColor="#888"
                value={note}
                onChangeText={(text) => handleNoteChange(key, text)}
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
          </View>
        );
      })}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        {/* <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={ppeNotesInput}
          onChangeText={handleOverallNotesChange}
          multiline
        /> */}
        <TextInput
          style={[styles.input, buttonsDisabled && styles.disabledField]}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={ppeNotesInput}
          onChangeText={handleOverallNotesChange}
          editable={!buttonsDisabled}
          multiline
        />
      </View>

      <ChecklistNavigator navigation={navigation} currentStep={3} />
      <View style={{ height: 100, width: "100%" }} />
    </ScrollView>
  );
};

// Keep your existing styles
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

export default PPEPage_Db;




