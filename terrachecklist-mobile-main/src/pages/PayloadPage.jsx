import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, Image, Alert, TouchableOpacity } from 'react-native';
import { useProject } from './ProjectContext'; // Import useProject from the correct file
import ChecklistNavigator from "../components/ChecklistNav";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

const PayloadPage = ({ navigation }) => {
  const {
    projectCode,
    payloadEquipment,
    payloadCheckedItems,
    setPayloadCheckedItems,
    payloadItemNotes,
    setPayloadItemNotes,
    payloadNotesInput,
    setPayloadNotesInput,
  } = useProject();
  
  const [checklistData, setChecklistData] = useState(null); // Use `null` to differentiate between no data and empty data
  const [loading, setLoading] = useState(true);
  const [evidenceFile, setEvidenceFile] = useState(null);
  


  // Function to load saved data from AsyncStorage
  const loadSavedData = async () => {
    try {
      const [savedCheckedItems, savedItemNotes, savedNotesInput, savedEvidenceFile] = await Promise.all([
        AsyncStorage.getItem('payloadCheckedItems'),
        AsyncStorage.getItem('payloadItemNotes'),
        AsyncStorage.getItem('payloadNotesInput'),
        AsyncStorage.getItem('payloadEvidenceFile')
      ]);
  
      // Only set state if the context states are empty
      if (savedCheckedItems && Object.keys(payloadCheckedItems).length === 0) {
        setPayloadCheckedItems(JSON.parse(savedCheckedItems));
      }
      if (savedItemNotes && Object.keys(payloadItemNotes).length === 0) {
        setPayloadItemNotes(JSON.parse(savedItemNotes));
      }
      if (savedNotesInput && !payloadNotesInput) {
        setPayloadNotesInput(savedNotesInput);
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

  // Save data to AsyncStorage and update ProjectContext whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.multiSet([
          ['payloadCheckedItems', JSON.stringify(payloadCheckedItems)],
          ['payloadItemNotes', JSON.stringify(payloadItemNotes)],
          ['payloadNotesInput', payloadNotesInput],
          ['payloadEvidenceFile', JSON.stringify(evidenceFile)]
        ]);
      } catch (error) {
        console.log('Error saving data:', error);
      }
    };
  
    saveData();
  }, [payloadCheckedItems, payloadItemNotes, payloadNotesInput, evidenceFile]);

  useEffect(() => {
   // console.log("Checked items updated:");
   // Object.entries(checkedItems).forEach(([key, value]) => {
    //  console.log(`  ${key}: ${value}`);
   // });
  }, [payloadCheckedItems]);
  
  useEffect(() => {
    // console.log("Item notes updated:");
    // Object.entries(itemNotes).forEach(([key, value]) => {
    //   console.log(`  ${key}: ${value}`);
    // });
  }, [payloadItemNotes]);
  
  useEffect(() => {
  //  console.log("Notes input updated:", notesInput);
  }, [payloadNotesInput]);


  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
        const response = await fetch("http://103.163.184.111:3000/payload_checklist");
        const data = await response.json();
    
        const matchedPayloads = data.filter(item => payloadEquipment.includes(item.payload_name));
        setChecklistData(matchedPayloads || []);
    
        setPayloadCheckedItems(prevChecked => {
          const updatedChecked = { ...prevChecked };
          matchedPayloads.forEach((payload) => {
            const payloadName = payload.payload_name;
            Object.keys(payload).forEach((key) => {
              if (key.startsWith("item_") && payload[key]) {
                const label = payload[key];
                const normalizedKey = `${payloadName}_${label}`.toLowerCase().replace(/ /g, "_");
                // Only initialize if not already set
                if (!(normalizedKey in updatedChecked)) {
                  updatedChecked[normalizedKey] = false;
                }
              }
            });
          });
          return updatedChecked;
        });
    
        setPayloadItemNotes(prevNotes => {
          const updatedNotes = { ...prevNotes };
          matchedPayloads.forEach((payload) => {
            const payloadName = payload.payload_name;
            Object.keys(payload).forEach((key) => {
              if (key.startsWith("item_") && payload[key]) {
                const label = payload[key];
                const normalizedKey = `${payloadName}_${label}`.toLowerCase().replace(/ /g, "_");
                // Only initialize if not already set
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
  }, [payloadEquipment]);
  

// versi lama
//   useEffect(() => {
//   const fetchChecklistData = async () => {
//     try {
//      // console.log("Fetching checklist data for payloadEquipment:", payloadEquipment);
//       const response = await fetch("http://103.163.184.111:3000/payload_checklist");
//       const data = await response.json();
//      // console.log("Fetched data from API:", data);

//       const matchedPayloads = data.filter(item => payloadEquipment.includes(item.payload_name));
//      // console.log("Matched checklist data:", matchedPayloads);
//       setChecklistData(matchedPayloads || []);

//       // ✅ Initialize unchecked items in checkedItems and itemNotes state
//       const initialChecked = { ...checkedItems };
//       const initialNotes = { ...itemNotes };

//       matchedPayloads.forEach((payload) => {
//         const payloadName = payload.payload_name;
//         Object.keys(payload).forEach((key) => {
//           if (key.startsWith("item_") && payload[key] !== null && payload[key] !== "") {
//             const label = payload[key];
//             const normalizedKey = `${payloadName}_${label}`.toLowerCase().replace(/ /g, "_");

//             // Initialize checkedItems
//             if (!(normalizedKey in initialChecked)) {
//               initialChecked[normalizedKey] = false;
//             }

//             // Initialize itemNotes
//             if (!(normalizedKey in initialNotes)) {
//               initialNotes[normalizedKey] = ""; // Default to an empty string
//             }
//           }
//         });
//       });

//       setCheckedItems(initialChecked); // Set default unchecked state
//       setItemNotes(initialNotes); // Set default empty notes
//     } catch (error) {
//       console.log("Error fetching checklist data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchChecklistData();
// }, [payloadEquipment]); 

  const normalizeKey = (key) => key.toLowerCase().replace(/ /g, "_");

  const toggleCheck = (itemKey) => {
    const normalizedKey = normalizeKey(itemKey);
    setPayloadCheckedItems((prevState) => ({
      ...prevState,
      [normalizedKey]: !prevState[normalizedKey], // Toggle the checked state
    }));
  };

  const handleNoteChange = (itemKey, text) => {
    const normalizedKey = normalizeKey(itemKey);
    setPayloadItemNotes((prevState) => ({
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

    return checklistData.map((payload, payloadIndex) => {
      // Extract all fields that start with "item_" and are not null
      const fields = Object.keys(payload)
        .filter((key) => key.startsWith("item_") && payload[key] !== null)
        .map((key) => payload[key])
        .filter((item) => item !== "");

      if (fields.length === 0) return null;

      // Use the payload name as the title
      const payloadName = payload.payload_name || `Payload ${payloadIndex + 1}`;

      return (
        <View key={payloadIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{`Payload - ${payloadName}`}</Text>
          {fields.map((item, index) => {
            // Create a unique key for each item using the payload name and item name
            const uniqueKey = `${payloadName}_${item}`;
            const normalizedKey = normalizeKey(uniqueKey);

            return (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>{item}</Text>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    payloadCheckedItems[normalizedKey] && styles.checkedButton,
                  ]}
                  onPress={() => toggleCheck(normalizedKey)}
                >
                  <Ionicons
                    name={payloadCheckedItems[normalizedKey] ? "checkmark" : "close"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="add note..."
                  placeholderTextColor="#888"
                  value={payloadItemNotes[normalizedKey] || ""}
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
    // Show "Payload Not Found" page if no data is found
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Payload Checklist</Text>
          <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
          <Text style={styles.subText}>Equipment: {payloadEquipment || "N/A"}</Text>
        </View>
        <Text style={styles.notFoundText}>Payload for {payloadEquipment || "N/A"} Not Found</Text>
        <ChecklistNavigator navigation={navigation} currentStep={1} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Payload Checklist</Text>
        <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
        <Text style={styles.subText}>Payload:</Text>
        {payloadEquipment && payloadEquipment.length > 0 ? (
          payloadEquipment.map((payload, index) => (
            <Text key={index} style={styles.subText}>• {payload}</Text>
          ))
        ) : (
          <Text style={styles.subText}>N/A</Text>
        )}
      </View>
  
      {/* ✅ Dynamically render all matched payloads */}
      {checklistData.map((payload, payloadIndex) => {
        const fields = Object.keys(payload)
          .filter((key) => key.startsWith("item_") && payload[key] !== null && payload[key] !== "")
          .map((key) => payload[key]);
  
        const payloadName = payload.payload_name || `Payload ${payloadIndex + 1}`;
  
        return (
          <View key={payloadIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{`Payload - ${payloadName}`}</Text>
            {fields.map((item, index) => {
              const uniqueKey = `${payloadName}_${item}`;
              const normalizedKey = normalizeKey(uniqueKey);
  
              return (
                <View key={index} style={styles.itemContainer}>
                  <Text style={styles.itemText}>{item}</Text>
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      payloadCheckedItems[normalizedKey] && styles.checkedButton,
                    ]}
                    onPress={() => toggleCheck(normalizedKey)}
                  >
                    <Ionicons
                      name={payloadCheckedItems[normalizedKey] ? "checkmark" : "close"}
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="add note..."
                    placeholderTextColor="#888"
                    value={payloadItemNotes[normalizedKey] || ""}
                    onChangeText={(text) => handleNoteChange(normalizedKey, text)}
                  />
                </View>
              );
            })}
          </View>
        );
      })}
  
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={payloadNotesInput}
          onChangeText={setPayloadNotesInput}
        />
      </View>
  
      <ChecklistNavigator navigation={navigation} currentStep={1} />
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
  checkedButton: {
    backgroundColor: 'green',
    borderColor: 'green',
  },

});

export default PayloadPage;

