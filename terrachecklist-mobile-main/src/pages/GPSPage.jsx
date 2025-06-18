import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useProject } from './ProjectContext'; // Import useProject from the correct file
import ChecklistNavigator from "../components/ChecklistNav";
import * as ImagePicker from 'expo-image-picker';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { usePPE } from './PPEContext';

const GPSPage = ({ navigation }) => {
  const { projectCode, gpsEquipment } = useProject(); // Access from Context
  const [checklistData, setChecklistData] = useState(null); // Use `null` to differentiate between no data and empty data
  const [loading, setLoading] = useState(true);
  const [evidenceFile, setEvidenceFile] = useState(null);
  //const { setGpsItemNotes, setGpsNotesInput } = useProject(); 

  const {gpsCheckedItems, setGpsCheckedItems, gpsItemNotes, setGpsItemNotes, gpsNotesInput, setGpsNotesInput} = useProject();

  // Function to load saved data from AsyncStorage
  const loadSavedData = async () => {
    try {
      const [savedCheckedItems, savedItemNotes, savedNotesInput, savedEvidenceFile] = await Promise.all([
        AsyncStorage.getItem('gpsCheckedItems'),
        AsyncStorage.getItem('gpsItemNotes'),
        AsyncStorage.getItem('gpsNotesInput'),
        AsyncStorage.getItem('gpsEvidenceFile')
      ]);
  
      // Only set state if the context states are empty
      if (savedCheckedItems && Object.keys(gpsCheckedItems).length === 0) {
        setGpsCheckedItems(JSON.parse(savedCheckedItems));
      }
      if (savedItemNotes && Object.keys(gpsItemNotes).length === 0) {
        setGpsItemNotes(JSON.parse(savedItemNotes));
      }
      if (savedNotesInput && !gpsNotesInput) {
        setGpsNotesInput(savedNotesInput);
      }
      if (savedEvidenceFile && !evidenceFile) {
        setEvidenceFile(JSON.parse(savedEvidenceFile));
      }
    } catch (error) {
      console.log('Error loading saved data:', error);
    }
  };

  // Load saved data when the page gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadSavedData();
    }, [])
  );

  useEffect(() => {

    // Object.entries(checkedItems).forEach(([key, value]) => {
    //   console.log(`(NOBRIDGE) LOG    ${key}: ${value}`);
    // });
  }, [gpsCheckedItems]);

   useEffect(() => {
  
    // Object.entries(itemNotes).forEach(([key, value]) => {
    //   console.log(`  ${key}: ${value}`);
    // });
  }, [gpsItemNotes]);
    
  useEffect(() => {

  }, [gpsNotesInput]);
  

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.multiSet([
          ['gpsCheckedItems', JSON.stringify(gpsCheckedItems)],
          ['gpsItemNotes', JSON.stringify(gpsItemNotes)],
          ['gpsNotesInput', gpsNotesInput],
          ['gpsEvidenceFile', JSON.stringify(evidenceFile)]
        ]);
      } catch (error) {
        console.log('Error saving data:', error);
      }
    };
  
    saveData();
  }, [gpsCheckedItems, gpsItemNotes, gpsNotesInput, evidenceFile]);

  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
        const response = await fetch("http://103.163.184.111:3000/gps_checklist");
        const data = await response.json();
        const matchedGPS = data.filter(item => gpsEquipment.includes(item.gps_name));
        setChecklistData(matchedGPS || []);
  
        setGpsCheckedItems(prevState => {
          const updatedChecked = { ...prevState };
          matchedGPS.forEach((gps) => {
            const gpsName = gps.gps_name;
            Object.keys(gps).forEach((key) => {
              if (key.startsWith("item_") && gps[key]) {
                const label = gps[key];
                const normalizedKey = `${gpsName}_${label}`.toLowerCase().replace(/ /g, "_");
                if (!(normalizedKey in updatedChecked)) {
                  updatedChecked[normalizedKey] = false;
                }
              }
            });
          });
          return updatedChecked;
        });
  
        // Add this block to initialize notes if not exists
        setGpsItemNotes(prevNotes => {
          const updatedNotes = { ...prevNotes };
          matchedGPS.forEach((gps) => {
            const gpsName = gps.gps_name;
            Object.keys(gps).forEach((key) => {
              if (key.startsWith("item_") && gps[key]) {
                const label = gps[key];
                const normalizedKey = `${gpsName}_${label}`.toLowerCase().replace(/ /g, "_");
                if (!(normalizedKey in updatedNotes)) {
                  updatedNotes[normalizedKey] = "";
                }
              }
            });
          });
          return updatedNotes;
        });
      } catch (error) {
        console.log("Error fetching checklist data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchChecklistData();
  }, [gpsEquipment]);
  

  //old version
  // useEffect(() => {
  //   const fetchChecklistData = async () => {
  //     try {
  //       // console.log("Fetching checklist data for gpsEquipment:", gpsEquipment);
  //       const response = await fetch("http://103.163.184.111:3000/gps_checklist");
  //       const data = await response.json();
  //       // console.log("Fetched data from API:", data);
  
  //       const matchedGPS = data.filter(item => gpsEquipment.includes(item.gps_name));
  //       // console.log("Matched checklist data:", matchedGPS);
  //       setChecklistData(matchedGPS || []);
  
  //       // Initialize all checkbox states
  //       const initialChecked = { ...checkedItems }; // Start from existing state
  //       matchedGPS.forEach((gps) => {
  //         const gpsName = gps.gps_name;
  //         Object.keys(gps).forEach((key) => {
  //           if (key.startsWith("item_") && gps[key] !== null && gps[key] !== "") {
  //             const label = gps[key];
  //             const normalizedKey = `${gpsName}_${label}`.toLowerCase().replace(/ /g, "_");
  //             if (!(normalizedKey in initialChecked)) {
  //               initialChecked[normalizedKey] = false;
  //             }
  //           }
  //         });
  //       });
  
  //       setCheckedItems(initialChecked); // Update state to include all checkboxes
  //     } catch (error) {
  //       console.log("Error fetching checklist data:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  
  //   fetchChecklistData();
  // }, [gpsEquipment]);  

  const normalizeKey = (key) => key.toLowerCase().replace(/ /g, "_");

  const toggleCheck = (itemKey) => {
    const normalizedKey = normalizeKey(itemKey);
    setGpsCheckedItems((prevState) => ({
      ...prevState,
      [normalizedKey]: !prevState[normalizedKey], // Toggle the checked state
    }));
  };

  const handleNoteChange = (itemKey, text) => {
    const normalizedKey = normalizeKey(itemKey);
    setGpsItemNotes((prevState) => ({
      ...prevState,
      [normalizedKey]: text, // Update the note for the specific item
    }));
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
      setEvidenceFile(result.assets[0]);
    }
  };

  const handleDeleteEvidence = () => {
    setEvidenceFile(null);
  };

  const renderDynamicFields = () => {
    if (!checklistData || checklistData.length === 0) return null;

    return checklistData.map((gps, gpsIndex) => {
      // Extract all fields that start with "item_" and are not null
      const fields = Object.keys(gps)
        .filter((key) => key.startsWith("item_") && gps[key] !== null)
        .map((key) => gps[key])
        .filter((item) => item !== "");

      if (fields.length === 0) return null;

      // Use the GPS name as the title
      const gpsName = gps.gps_name || `GPS ${gpsIndex + 1}`;

      return (
        <View key={gpsIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{`GPS - ${gpsName}`}</Text>
          {fields.map((item, index) => {
            // Create a unique key for each item using the GPS name and item name
            const uniqueKey = `${gpsName}_${item}`;
            const normalizedKey = normalizeKey(uniqueKey);

            return (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>{item}</Text>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    gpsCheckedItems[normalizedKey] && styles.checkedButton,
                  ]}
                  onPress={() => toggleCheck(normalizedKey)}
                >
                  <AntDesign
                    name={gpsCheckedItems[normalizedKey] ? "check" : "close"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="add note..."
                  placeholderTextColor="#888"
                  value={gpsItemNotes[normalizedKey] || ""}
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
    // Show "GPS Not Found" page if no data is found
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>GPS Checklist</Text>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
          <Text style={styles.subText}>Equipment: {gpsEquipment || "N/A"}</Text>
        </View>
        <Text style={styles.notFoundText}>GPS for {gpsEquipment || "N/A"} Not Found</Text>
        <ChecklistNavigator navigation={navigation} currentStep={2} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>GPS Checklist</Text>
        <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
        <Text style={styles.subText}>Equipment:</Text>
        {gpsEquipment && gpsEquipment.length > 0 ? (
          gpsEquipment.map((gps, index) => (
            <Text key={index} style={styles.subText}>• {gps}</Text>
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
          value={gpsNotesInput}
          onChangeText={setGpsNotesInput}
        />
      </View>



      <ChecklistNavigator navigation={navigation} currentStep={2} />
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
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
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
  checkedButton: {
    backgroundColor: 'green',
    borderColor: 'green',
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
});

export default GPSPage;

