import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, Image, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import ChecklistNavigator from "../components/ChecklistNav";
import { useProject } from './ProjectContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const UAVPage = ({ navigation }) => {
  const { projectCode, uavEquipment } = useProject();
  const { email } = useContext(AuthContext);
  const [checklistData, setChecklistData] = useState(null);
  const [loading, setLoading] = useState(true);
 // const [UAVnotesInput, setUAVNotesInput] = useState('');
  const [UAVevidenceFile, setUAVEvidenceFile] = useState(null);
 // const [UAVcheckedItems, setUAVCheckedItems] = useState({});
 // const { UAVitemNotes, setUAVItemNotes } = useProject();
  const [dataLoaded, setDataLoaded] = useState(false);
  const { UAVnotesInput, setUAVNotesInput, UAVcheckedItems, setUAVCheckedItems, UAVitemNotes, setUAVItemNotes, resetChecklistState } = useProject();


  // Function to load saved data from AsyncStorage
  const loadSavedData = async () => {
    try {
      const savedCheckedItems = await AsyncStorage.getItem('UAVcheckedItems');
      const savedItemNotes = await AsyncStorage.getItem('UAVitemNotes');
      const savedNotesInput = await AsyncStorage.getItem('UAVnotesInput');
      const savedEvidenceFile = await AsyncStorage.getItem('UAVevidenceFile');

      if (savedCheckedItems) setUAVCheckedItems(JSON.parse(savedCheckedItems));
      if (savedItemNotes) setUAVItemNotes(JSON.parse(savedItemNotes));
      if (savedNotesInput) setUAVNotesInput(savedNotesInput);
      if (savedEvidenceFile) setUAVEvidenceFile(JSON.parse(savedEvidenceFile));
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading saved data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load saved data when the page gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadSavedData();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      console.log('🎯 UAV Page focused, notesInput sekarang:', UAVnotesInput);
    }, [UAVnotesInput])
  );



  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        const normalizedCheckedItems = Object.fromEntries(
          Object.entries(UAVcheckedItems).map(([key, value]) => [normalizeKey(key), value])
        );
        const normalizedItemNotes = Object.fromEntries(
          Object.entries(UAVitemNotes).map(([key, value]) => [normalizeKey(key), value])
        );
  
      //  console.log("Saving Normalized UAVcheckedItems:", normalizedCheckedItems);
       // console.log("Saving Normalized UAVitemNotes:", normalizedItemNotes);
  
        await AsyncStorage.setItem('UAVcheckedItems', JSON.stringify(normalizedCheckedItems));
        await AsyncStorage.setItem('UAVitemNotes', JSON.stringify(normalizedItemNotes));
      } catch (error) {
        console.error("Error saving data:", error);
      }
    };
  
    saveData();
  }, [UAVcheckedItems, UAVitemNotes]);

  useEffect(() => {
  //  console.log("UAVitemNotes Updated:", UAVitemNotes);
  }, [UAVitemNotes]);
  
  useEffect(() => {
   // console.log("UAVnotesInput Updated:", UAVnotesInput);
  }, [UAVnotesInput]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', async () => {
      try {
        await AsyncStorage.setItem('UAVnotesInput', UAVnotesInput);
      } catch (error) {
        console.error('Error saving UAVnotesInput on blur:', error);
      }
    });
  
    return unsubscribe;
  }, [navigation, UAVnotesInput]);  
  
  useEffect(() => {
    const saveEvidenceFile = async () => {
      try {
        await AsyncStorage.setItem('UAVevidenceFile', JSON.stringify(UAVevidenceFile));
      } catch (error) {
        console.error("Error saving UAVevidenceFile:", error);
      }
    };
  
    saveEvidenceFile();
  }, [UAVevidenceFile]);
  
  // Fetch checklist data from API
  useEffect(() => {
    if (!dataLoaded) return; // Wait for AsyncStorage data to load
  
    const normalizeKey = (key) =>
      key.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  
    const fetchChecklistData = async () => {
      try {
        const response = await fetch("http://103.163.184.111:3000/inventory_checklist");
        const data = await response.json();
  
        // Filter and normalize UAV equipment
        const matchedUAVs = data.filter((item) =>
          uavEquipment.some(
            (equipment) => normalizeKey(equipment) === normalizeKey(item.equipment_uav)
          )
        );
  
        // Ensure unique entries in checklistData
        const uniqueUAVs = Array.from(
          new Map(
            matchedUAVs.map((item) => [normalizeKey(item.equipment_uav), item])
          ).values()
        );
  
        setChecklistData(uniqueUAVs || []);
  
        const expectedKeysSet = new Set();
  
        uniqueUAVs.forEach((uav) => {
          const sectionCounters = {};
          Object.keys(uav).forEach((key) => {
            const sectionPrefixes = ["uav_", "power_system_", "gcs_", "standard_acc_", "charger_box_"];
            const matchedPrefix = sectionPrefixes.find((prefix) => key.startsWith(prefix));
  
            if (matchedPrefix && uav[key]) {
              const section = matchedPrefix.slice(0, -1); // Remove trailing underscore
              sectionCounters[section] = (sectionCounters[section] || 0) + 1;
  
              const normalizedKey = `${normalizeKey(uav.equipment_uav)}_${section}_${sectionCounters[section]}`;
              expectedKeysSet.add(normalizedKey);
            }
          });
        });
  
        // Filter UAVcheckedItems to only rendered keys
        setUAVCheckedItems((prevState) => {
          const filteredState = {};
          expectedKeysSet.forEach((key) => {
            filteredState[key] = prevState[key] ?? false;
          });
          return filteredState;
        });
  
        // Filter UAVitemNotes to only rendered keys
        setUAVItemNotes((prevState) => {
          const filteredNotes = {};
          expectedKeysSet.forEach((key) => {
            if (prevState[key] !== undefined) {
              filteredNotes[key] = prevState[key];
            }
          });
          return filteredNotes;
        });
      } catch (error) {
        console.error("Error fetching checklist data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchChecklistData();
  }, [uavEquipment, dataLoaded]);
  
  const normalizeKey = (key) => {
    return key
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "_")  // replace any space or underscore group with one underscore
      .replace(/^_+|_+$/g, ""); // trim leading/trailing underscores
  };  

  const toggleCheck = (itemKey) => {
    const normalizedKey = normalizeKey(itemKey);
    setUAVCheckedItems((prevState) => {
      const updatedState = {
        ...prevState,
        [normalizedKey]: !prevState[normalizedKey], // Toggle the checkbox state
      };
    //  console.log("Updated UAVcheckedItems State:", updatedState);
      return updatedState;
    });
  };
  
  useEffect(() => {
    const saveData = async () => {
      try {
     //   console.log("Saving UAVitemNotes to AsyncStorage:", UAVitemNotes);
        await AsyncStorage.setItem('UAVitemNotes', JSON.stringify(UAVitemNotes));
      } catch (error) {
        console.error("Error saving UAVitemNotes:", error);
      }
    };
  
    saveData();
  }, [UAVitemNotes]);

  const handleNoteChange = (itemKey, text) => {
    const normalizedKey = normalizeKey(itemKey);
    setUAVItemNotes((prevState) => {
      const updatedNotes = {
        ...prevState,
        [normalizedKey]: text,
      };
     // console.log("Updated UAVitemNotes in UAVPage:", updatedNotes);
      return updatedNotes;
    });
  };

  const handleSelectEvidence = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permission to upload evidence.');
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
    const sections = [
      { prefix: "uav_", title: "UAV" },
      { prefix: "power_system_", title: "Power System" },
      { prefix: "gcs_", title: "GCS" },
      { prefix: "standard_acc_", title: "Standard Accessories" },
      { prefix: "charger_box_", title: "Charger Box" },
    ];
  
    return sections.map((section, sectionIndex) => {
      const fields = Object.keys(uav)
        .filter((key) => key.startsWith(section.prefix) && uav[key] !== null)
        .map((key) => uav[key])
        .filter((item) => item !== "");
  
      if (fields.length === 0) return null;
  
      let sectionCounter = 0; // Counter for each section
      return (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{`${section.title}`}</Text>
          {fields.map((item, index) => {
            sectionCounter += 1; // Increment the counter for each item
            const uniqueKey = `${uav.equipment_uav || "UAV"}_${section.prefix}_${sectionCounter}`;
            const normalizedKey = normalizeKey(uniqueKey);
  
            return (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>{item}</Text>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    UAVcheckedItems[normalizedKey] && styles.checkedButton,
                  ]}
                  onPress={() => toggleCheck(normalizedKey)}
                >
                  {UAVcheckedItems[normalizedKey] && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="add note..."
                  placeholderTextColor="#888"
                  value={UAVitemNotes[normalizedKey] || ""}
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
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>UAV Page</Text>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
          <Text style={styles.subText}>UAV:</Text>
          {uavEquipment && uavEquipment.length > 0 ? (
            uavEquipment.map((uav, index) => (
              <Text key={index} style={styles.subText}>• {uav}</Text>
            ))
          ) : (
            <Text style={styles.subText}>N/A</Text>
          )}
        </View>
    
        {checklistData && checklistData.length > 0 ? (
          checklistData.map((uav, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.sectionTitleuav}>{`UAV - ${uav.equipment_uav}`}</Text>
              {renderDynamicFields(uav)}
            </View>
          ))
        ) : (
          <View style={styles.section}>
            <Text style={styles.noDataText}>No checklist data found for this equipment.</Text>
          </View>
        )}
    
        
    
        <ChecklistNavigator navigation={navigation} currentStep={0} />
        <View style={{ height: 100, width: "100%" }} />
      </ScrollView>
    );
    
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity 
      style={styles.backButton}
      onPress={() => navigation.navigate('Main', { screen: 'ProjectList' })}
    >
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
        <Text style={styles.headerText}>UAV Page</Text>
        <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
        <Text style={styles.subText}>UAV:</Text>
        {uavEquipment && uavEquipment.length > 0 ? (
          uavEquipment.map((uav, index) => (
            <Text key={index} style={styles.subText}>• {uav}</Text>
          ))
        ) : (
          <Text style={styles.subText}>N/A</Text>
        )}
      </View>

      {checklistData.map((uav, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.sectionTitleuav}>{`UAV - ${uav.equipment_uav}`}</Text>
          {renderDynamicFields(uav)}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={UAVnotesInput}
          onChangeText={setUAVNotesInput}
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
    backgroundColor: '#040F2E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#040F2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1F3A93',
    paddingTop: 50,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    marginTop: 0,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subText: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  section: {
    backgroundColor: '#1B2A52',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 10,
  },
  sectionTitleuav: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 10,
    textAlign: 'left',
    paddingLeft: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  itemText: {
    fontSize: 14,
    color: '#E5E5E5',
    flex: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#000',
    flex: 1,
    marginHorizontal: 5,
  },
  checkButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
    checkButton: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  evidenceContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 5,
  },
  uploadButton: {
    backgroundColor: '#00CFFF',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonContainer: {
    marginHorizontal: 15,
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#00CFFF',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  checkedButton: {
    backgroundColor: 'green',
    borderColor: 'green',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888', // abu-abu netral
    paddingVertical: 20,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },  
  headerTopRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
backButton: {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
  marginBottom: 10,
},

});

export default UAVPage;
