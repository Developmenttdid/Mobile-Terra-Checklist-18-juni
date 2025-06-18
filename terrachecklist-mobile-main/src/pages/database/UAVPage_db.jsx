import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
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
import ChecklistNavigator from "../../components/ChecklistNav_db";
import { useProject } from "../ProjectContext";
import { useSaveContext } from "./SaveContext";
import { useSaveInContext } from "./SaveInContext";

const UAVPage_Db = ({ navigation }) => {
  const { projectCode, uavEquipment } = useProject();
  const [loading, setLoading] = useState(true);
  const [UAVevidenceFile, setUAVEvidenceFile] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isDataFromDatabase, setIsDataFromDatabase] = useState(false);
  const [email, setEmail] = useState("");
  const {
    uavCheckedItems,
    setUavCheckedItems,
    uavItemNotes,
    setUavItemNotes,
    uavNotesInput,
    setUavNotesInput,
    uavChecklistData,
    setUavChecklistData,
    isUavEdited,
    setIsUavEdited,
    isUavSaving,
    setIsUavSaving,
  } = useSaveContext();

  const {uavSecondCheckedItems, setUavSecondCheckedItems, buttonsDisabled, setButtonsDisabled} = useSaveInContext();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("userEmail");
        if (!storedEmail) {
          Alert.alert("Error", "No email found in AsyncStorage");
          console.log("email not found");
          return;
        }
        setEmail(storedEmail);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!uavChecklistData || uavChecklistData.length === 0) return;

    const dbChecked = { ...uavCheckedItems };
    const dbNotes = { ...uavItemNotes };

    uavChecklistData.forEach((uav) => {
      const equipmentName = normalizeKey(uav.equipment_uav);
      const sections = [
        { prefix: "uav_" },
        { prefix: "power_system_" },
        { prefix: "gcs_" },
        { prefix: "standard_acc_" },
      ];

      sections.forEach((section) => {
        const keys = Object.keys(uav).filter(
          (key) => key.startsWith(section.prefix) && uav[key]
        );

        keys.forEach((key, index) => {
          const normalizedKey = `${section.prefix}${index + 1}`;
          const fullKey = generateKey(equipmentName, normalizedKey);

          if (dbChecked[fullKey] === undefined) {
            dbChecked[fullKey] = false;
          }

          if (dbNotes[fullKey] === undefined) {
            dbNotes[fullKey] = "";
          }
        });
      });
    });

    setUavCheckedItems(dbChecked);
    setUavItemNotes(dbNotes);
  }, [uavChecklistData]);

  const checkChecklistInData = async () => {
    try {
      const response = await fetch(
        `http://103.163.184.111:3000/uav_database_in?project_code=${projectCode}`
      );
      const data = await response.json();
      const hasExistingData = data.some(item => item.project_code === projectCode);
      setButtonsDisabled(hasExistingData);
    } catch (error) {
      console.error("Error checking checklist data:", error);
      setButtonsDisabled(false);
    }
  };

  const loadSavedData = async () => {
    try {
      const savedEvidenceFile = await AsyncStorage.getItem("UAVevidenceFile");
      if (savedEvidenceFile) setUAVEvidenceFile(JSON.parse(savedEvidenceFile));
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading saved data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = (equipmentName, itemKey) => {
    return `${normalizeKey(equipmentName)}_${normalizeKey(itemKey)}`;
  };

  const fetchSecondCheckboxData = async () => {
    try {
      const response = await fetch('http://103.163.184.111:3000/uav_database_in');
      const data = await response.json();
      const projectData = data.filter(item => item.project_code === projectCode);
      
      if (projectData.length === 0) {
        console.log('No second checkbox data found for this project');
        return;
      }

      const newCheckedItems = {};
      
      projectData.forEach(uavData => {
        const equipmentName = normalizeKey(uavData.equipment_uav);

        Object.keys(uavData).forEach(key => {
          if (key.startsWith('uav_') || 
              key.startsWith('power_system_') || 
              key.startsWith('gcs_') || 
              key.startsWith('standard_acc_')) {
            
            const fullKey = `${equipmentName}_${normalizeKey(key)}`;
            newCheckedItems[fullKey] = uavData[key] === 'true';
          }
        });
      });

      setUavSecondCheckedItems(newCheckedItems);
      console.log('Second checkbox data loaded from database');
    } catch (error) {
      console.error('Error fetching second checkbox data:', error);
    }
  };

  const fetchDatabaseData = async () => {
    try {
      const response = await fetch(`http://103.163.184.111:3000/uav_database`);
      const data = await response.json();
      const filteredData = data.filter(
        (item) => item.project_code === projectCode
      );

      if (filteredData.length > 0) {
        const dbChecked = {};
        const dbNotes = {};

        const equipmentGroups = filteredData.reduce((groups, item) => {
          const key = item.equipment_uav;
          if (
            !groups[key] ||
            new Date(item.timestamp) > new Date(groups[key].timestamp)
          ) {
            groups[key] = item;
          }
          return groups;
        }, {});

        Object.values(equipmentGroups).forEach((equipmentData) => {
          Object.keys(equipmentData).forEach((key) => {
            if (key.endsWith("_notes")) {
              const baseKey = normalizeKey(key.replace("_notes", ""));
              const fullKey = generateKey(equipmentData.equipment_uav, baseKey);
              dbNotes[fullKey] = equipmentData[key] || "";
            } else if (
              key.startsWith("uav_") ||
              key.startsWith("power_system_") ||
              key.startsWith("gcs_") ||
              key.startsWith("standard_acc_")
            ) {
              const fullKey = generateKey(equipmentData.equipment_uav, key);
              dbChecked[fullKey] = equipmentData[key] === "true";
            }
          });
        });

        setUavCheckedItems(dbChecked);
        setUavItemNotes(dbNotes);
        const latestNotes = Object.values(equipmentGroups).find(
          (e) => e.notes?.trim() !== ""
        );
        setUavNotesInput(latestNotes?.notes || "");

        setIsDataFromDatabase(true);
      } else {
        console.log(`No data found for project: ${projectCode}`);
        setIsDataFromDatabase(false);
      }
    } catch (error) {
      console.error("Error fetching database data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistData = async () => {
    try {
      const response = await fetch(
        "http://103.163.184.111:3000/inventory_checklist"
      );
      const data = await response.json();

      const matchedUAVs = data.filter((item) =>
        uavEquipment.some(
          (equipment) =>
            normalizeKey(equipment) === normalizeKey(item.equipment_uav)
        )
      );

      const uniqueUAVs = matchedUAVs.reduce((acc, item) => {
        const key = normalizeKey(item.equipment_uav);
        if (
          !acc[key] ||
          new Date(item.timestamp) > new Date(acc[key].timestamp)
        ) {
          acc[key] = item;
        }
        return acc;
      }, {});

      const uniqueUAVArray = Object.values(uniqueUAVs);

      setUavChecklistData(uniqueUAVArray || []);
    } catch (error) {
      console.error("Error fetching checklist data:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSavedData();
      fetchChecklistData();
      fetchSecondCheckboxData();
      checkChecklistInData();

      if (!isUavEdited) {
        fetchDatabaseData();
      }
    }, [projectCode, isUavEdited])
  );

  const saveUavSecondCheckboxData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      const payloads = uavChecklistData.map(uav => {
        const equipmentName = uav.equipment_uav;
        const payload = {
          email: email,
          project_code: projectCode,
          equipment_uav: equipmentName
        };

        Object.keys(uav)
          .filter(key => key.startsWith("uav_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(key)}`;
            payload[`uav_${index+1}`] = String(uavSecondCheckedItems[fullKey] || false);
          });

        Object.keys(uav)
          .filter(key => key.startsWith("power_system_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(key)}`;
            payload[`power_system_${index+1}`] = String(uavSecondCheckedItems[fullKey] || false);
          });

        Object.keys(uav)
          .filter(key => key.startsWith("gcs_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(key)}`;
            payload[`gcs_${index+1}`] = String(uavSecondCheckedItems[fullKey] || false);
          });

        Object.keys(uav)
          .filter(key => key.startsWith("standard_acc_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(key)}`;
            payload[`standard_acc_${index+1}`] = String(uavSecondCheckedItems[fullKey] || false);
          });

        return payload;
      });

      const response = await fetch("http://103.163.184.111:3000/uav_database_in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloads),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save data");
      }

      const result = await response.json();
      Alert.alert("Success", "Second checkbox data saved successfully");
      
      await AsyncStorage.removeItem(`uavSecondChecks_${projectCode}`);
      
      return result;
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save second checkbox data");
      throw error;
    }
  };

  const normalizeKey = (key) => {
    return key
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const toggleCheck = (equipmentName, itemKey) => {
    const fullKey = generateKey(equipmentName, itemKey);
    setUavCheckedItems((prev) => ({
      ...prev,
      [fullKey]: !(prev[fullKey] || false),
    }));
    setIsUavEdited(true);
  };

  const handleNoteChange = (equipmentName, itemKey, text) => {
    const fullKey = generateKey(equipmentName, itemKey);
    setUavItemNotes((prev) => ({
      ...prev,
      [fullKey]: text,
    }));
    setIsUavEdited(true);
  };

  const handleNotesInputChange = (text) => {
    setUavNotesInput(text);
    setIsUavEdited(true);
  };

  const toggleSecondCheck = (equipmentName, itemKey) => {
    const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(itemKey)}`;

    setUavSecondCheckedItems((prev) => ({
      ...prev,
      [fullKey]: !(prev[fullKey] || false),
    }));

    AsyncStorage.setItem(
      `uavSecondChecks_${projectCode}`,
      JSON.stringify({
        ...uavSecondCheckedItems,
        [fullKey]: !(uavSecondCheckedItems[fullKey] || false),
      })
    ).catch((e) => console.log("Gagal simpan:", e));
  };

  useFocusEffect(
    useCallback(() => {
      const loadState = async () => {
        try {
          const saved = await AsyncStorage.getItem(
            `uavSecondChecks_${projectCode}`
          );
          if (saved) setUavSecondCheckedItems(JSON.parse(saved));
        } catch (e) {
          console.log("Gagal load state:", e);
        }
      };
      loadState();
    }, [projectCode])
  );

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
      setUAVEvidenceFile(result.assets[0]);
    }
  };

  const handleDeleteEvidence = () => {
    setUAVEvidenceFile(null);
  };

  const renderDynamicFields = (uav) => {
    const equipmentName = normalizeKey(uav.equipment_uav);

    const sections = [
      { prefix: "uav_", title: "UAV" },
      { prefix: "power_system_", title: "Power System" },
      { prefix: "gcs_", title: "GCS" },
      { prefix: "standard_acc_", title: "Standard Accessories" },
    ];

    return sections.map((section, sectionIndex) => {
      const fields = Object.keys(uav)
        .filter((key) => key.startsWith(section.prefix) && uav[key] !== null)
        .map((key) => uav[key])
        .filter((item) => item !== "");

      if (fields.length === 0) return null;

      return (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {fields.map((item, index) => {
            const itemNumber = index + 1;
            const normalizedKey = `${section.prefix}${itemNumber}`;
            const fullKey = generateKey(equipmentName, normalizedKey);

            return (
              <View key={fullKey} style={styles.itemContainer}>
                <Text style={styles.itemText}>{item}</Text>
                {buttonsDisabled ? (
                  <View style={[
                    styles.checkButton, 
                    uavCheckedItems[fullKey] && styles.checkedButton
                  ]}>
                    {uavCheckedItems[fullKey] && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      uavCheckedItems[fullKey] && styles.checkedButton
                    ]}
                    onPress={() => toggleCheck(equipmentName, normalizedKey)}
                  >
                    {uavCheckedItems[fullKey] && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                )}

                {buttonsDisabled ? (
                  <View style={[
                    styles.checkButton,
                    { marginStart: 10 },
                    (uavSecondCheckedItems[fullKey] || false) && styles.checkedButtonIn
                  ]}>
                    {(uavSecondCheckedItems[fullKey] || false) && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      { marginStart: 10 },
                      (uavSecondCheckedItems[fullKey] || false) && styles.checkedButtonIn
                    ]}
                    onPress={() => toggleSecondCheck(equipmentName, normalizedKey)}
                  >
                    {(uavSecondCheckedItems[fullKey] || false) && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                )}

                <TextInput
                  style={[styles.input, buttonsDisabled && styles.disabledField]}
                  placeholder="add note..."
                  value={uavItemNotes[fullKey] || ""}
                  onChangeText={(text) => handleNoteChange(equipmentName, normalizedKey, text)}
                  editable={!buttonsDisabled}
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

  if (!uavChecklistData || uavChecklistData.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.headerText}>UAV Page</Text>
          </View>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
          <Text style={styles.subText}>UAV:</Text>
          {uavEquipment && uavEquipment.length > 0 ? (
            uavEquipment.map((uav, index) => (
              <Text key={index} style={styles.subText}>
                • {uav}
              </Text>
            ))
          ) : (
            <Text style={styles.subText}>N/A</Text>
          )}
        </View>

        <Text style={styles.notFoundText}>
          No equipment found for this project.
        </Text>

        <ChecklistNavigator navigation={navigation} currentStep={0} />
        <View style={{ height: 100, width: "100%" }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Main', { screen: 'ProjectList' })}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerText}>UAV Page</Text>
        </View>
        <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
        <Text style={styles.subText}>UAV:</Text>
        {uavEquipment && uavEquipment.length > 0 ? (
          uavEquipment.map((uav, index) => (
            <Text key={index} style={styles.subText}>
              • {uav}
            </Text>
          ))
        ) : (
          <Text style={styles.subText}>N/A</Text>
        )}
      </View>

      {uavChecklistData.map((uav, index) => (
        <View key={index} style={styles.card}>
          <Text
            style={styles.sectionTitleuav}
          >{`UAV - ${uav.equipment_uav}`}</Text>
          {renderDynamicFields(uav)}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, buttonsDisabled && styles.disabledField]}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={uavNotesInput}
          onChangeText={handleNotesInputChange}
          editable={!buttonsDisabled}
        />
      </View>

      <ChecklistNavigator navigation={navigation} currentStep={0} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
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
  sectionTitleuav: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00CFFF",
    marginBottom: 10,
    textAlign: "left",
    paddingLeft: 20,
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
  checkedButtonIn: {
    backgroundColor: "#FF9800",
    borderColor: "#F57C00",
  },
  disabledField: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
    textAlign: "center",
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
});

export default UAVPage_Db;