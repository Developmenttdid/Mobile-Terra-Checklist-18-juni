import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from 'expo-image-picker';
import ChecklistNavigator from "../../components/ChecklistNav_db";
import { useProject } from "../ProjectContext";
import { useSaveContext } from "./SaveContext";
import { useSaveInContext } from "./SaveInContext";

const HandoverPage_Db = ({ navigation }) => {
  const { projectCode } = useProject();
  const [email, setEmail] = useState("");
  const [picOpen, setPicOpen] = useState(false);
  const [picValue, setPicValue] = useState("");
  const [picItems, setPicItems] = useState([]);
  const [handoverNotesInput, setHandoverNotesInput] = useState("");
  const [equipmentOutChecked, setEquipmentOutChecked] = useState(false);
  const [equipmentInChecked, setEquipmentInChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [handoverData, setHandoverData] = useState(null);
  const [handoverEvidenceFiles, setHandoverEvidenceFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const {
    handleUavSave,
    handleGpsSave,
    handlePayloadSave,
    handlePpeSave,
    handleOtherSave,
  } = useSaveContext();

  const { saveUavSecondCheckboxData, savePayloadSecondCheckboxData, saveGpsSecondCheckboxData, savePpeSecondCheckboxData, saveOtherSecondCheckboxData, clearAllSecondCheckboxStates, buttonsDisabled, setButtonsDisabled } = useSaveInContext();

  // Add this useEffect to load email when component mounts
  useEffect(() => {
    const loadEmail = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (userEmail) {
          setEmail(userEmail);
        }
      } catch (error) {
        console.error("Failed to load email:", error);
      }
    };
    loadEmail();
  }, []);

  // Function to check if checklist in data exists (only check uav_database_in)
  const checkChecklistInData = async () => {
    try {
      const response = await fetch(
        `http://103.163.184.111:3000/uav_database_in?project_code=${projectCode}`
      );
      const data = await response.json();
      
      // Cek apakah ada data dengan project_code yang sama dengan projectCode saat ini
      const hasExistingData = data.some(item => item.project_code === projectCode);
      setButtonsDisabled(hasExistingData);
      
    } catch (error) {
      console.error("Error checking checklist data:", error);
      setButtonsDisabled(false); // Default enabled jika error
    }
  };

  // Fetch dropdown data from the API
  const fetchPICData = async () => {
    try {
      const response = await fetch("http://103.163.184.111:3000/users");
      const data = await response.json();

      const formattedData = data.map((user) => ({
        label: user.name,
        value: user.name,
      }));

      setPicItems(formattedData);
    } catch (error) {
      console.error("Error fetching PIC data:", error);
    }
  };

  // Fetch handover data from the database
  const fetchHandoverData = async () => {
    try {
      const response = await fetch(
        `http://103.163.184.111:3000/handover_database?project_code=${projectCode}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch handover data");
      }
      const data = await response.json();

      // Filter by projectCode and get the latest record by id
      const filteredData = data
        .filter((handover) => handover.project_code === projectCode)
        .sort((a, b) => b.id - a.id); // Sort by id in descending order

      if (filteredData.length > 0) {
        const latestHandover = filteredData[0]; // Get the latest record
        setHandoverData(latestHandover);
        setPicValue(latestHandover.pic_project || "");
        setHandoverNotesInput(latestHandover.notes || "");
        setEquipmentOutChecked(
          latestHandover.equipment_out === true ||
            latestHandover.equipment_out === "true"
        );
        setEquipmentInChecked(
          latestHandover.equipment_in === true ||
            latestHandover.equipment_in === "true"
        );
        setEmail(latestHandover.email || "");
        
        if (latestHandover.evidence) {
          setHandoverEvidenceFiles(
            latestHandover.evidence.split(',').map(uri => ({ uri }))
          );
        }
      } else {
        console.warn("No handover data found for the given projectCode.");
      }
    } catch (error) {
      console.error("Error fetching handover data:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadEvidenceFiles = async () => {
    setIsUploading(true);
    const uploadedFiles = [];
    
    try {
      for (const file of handoverEvidenceFiles) {
        if (file.uri.startsWith('http')) {
          uploadedFiles.push(file.uri);
          continue;
        }

        const formData = new FormData();
        formData.append('evidence', {
          uri: file.uri,
          name: `evidence_${Date.now()}.jpg`,
          type: 'image/jpeg'
        });

        const response = await fetch('http://103.163.184.111:3000/handover_upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const result = await response.json();
        uploadedFiles.push(result.evidence);
      }
      return uploadedFiles;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required", 
          "Please grant gallery permission to select photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setHandoverEvidenceFiles(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error("Error selecting images:", error);
      Alert.alert("Error", "Failed to select images from gallery");
    }
  };

  const handleSelectFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required", 
          "Please grant camera permission to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets) {
        setHandoverEvidenceFiles(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleSelectHandoverEvidence = () => {
    Alert.alert(
      "Select Evidence",
      "Choose how to upload evidence",
      [
        { text: "Take Photo", onPress: handleSelectFromCamera },
        { text: "Choose from Gallery", onPress: handleSelectFromGallery },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteHandoverEvidence = (index) => {
    setHandoverEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renderEvidenceItem = ({ item, index }) => (
    <View style={styles.evidenceItem}>
      <TouchableOpacity 
        onPress={() => {
          setSelectedImage(item.uri);
          setModalVisible(true);
        }}
      >
        <Image source={{ uri: item.uri }} style={styles.evidenceImage} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDeleteHandoverEvidence(index)}
      >
        <AntDesign name="delete" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const handleSaveHandover = async () => {
    const currentEmail = await AsyncStorage.getItem('userEmail');
    try {
      let evidenceUrls = handoverEvidenceFiles.map(file => 
        file.uri.startsWith('http') ? file.uri : null
      ).filter(Boolean);

      if (handoverEvidenceFiles.some(file => !file.uri.startsWith('http'))) {
        evidenceUrls = await uploadEvidenceFiles();
      }

      const payload = {
        project_code: projectCode,
        email: currentEmail,
        approver: "Atikah",
        pic_project: picValue,
        equipment_out: equipmentOutChecked,
        equipment_in: equipmentInChecked,
        notes: handoverNotesInput || null,
        evidence: evidenceUrls.join(','),
        timestamp: new Date().toISOString(),
      };
  
      console.log("Saving handover data with payload:", payload);
  
      let response;
      if (handoverData?.id) {
        // Update existing
        response = await fetch(
          `http://103.163.184.111:3000/handover_database/${handoverData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Create new
        response = await fetch(
          "http://103.163.184.111:3000/handover_database",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save handover data");
      }
  
      const result = await response.json();
      Alert.alert("Success", "Handover data saved successfully!");
      fetchHandoverData(); // Refresh data
      return result; // Return the saved data
    } catch (error) {
      console.error("Error saving handover data:", error);
      throw error; // Re-throw to be caught in handleSaveAll
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchPICData();
      fetchHandoverData();
      checkChecklistInData();
    }, [projectCode])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CFFF" />
      </View>
    );
  }

const handleSaveAll = async () => {
  try {
    // Simpan semua checklist
    const results = await Promise.allSettled([
      handleUavSave().catch(e => {
        console.error('UAV save failed:', e);
        throw new Error(`UAV: ${e.message}`);
      }),
      handleGpsSave(),
      handlePayloadSave(),
      handlePpeSave(),
      handleOtherSave()
    ]);

    // Cek jika ada yang gagal
    const failedSaves = results.filter(r => r.status === 'rejected');
    if (failedSaves.length > 0) {
      const uavError = failedSaves.find(f => f.reason.message.includes('UAV'));
      if (uavError) {
        throw new Error(`Failed to save UAV data: ${uavError.reason.message}`);
      }
      throw new Error(`Some data failed to save. Check logs for details.`);
    }

    // Simpan handover
    await handleSaveHandover();
    
    Alert.alert("Success", "All data saved successfully");
    navigation.navigate("ProjectList");
  } catch (error) {
    console.error("Save all error:", error);
    Alert.alert(
      "Error", 
      error.message || "Failed to save data. Please try again."
    );
  }
};

  const saveAllInCheckbox = async () => {
    try {
      await Promise.all([
        saveUavSecondCheckboxData(),
        savePayloadSecondCheckboxData(),
        saveGpsSecondCheckboxData(),
        savePpeSecondCheckboxData(),
        saveOtherSecondCheckboxData()
      ]);

      // Clear all second checkbox states after successful save
      await clearAllSecondCheckboxStates();
      setButtonsDisabled(true); // Langsung disable setelah save berhasil

      Alert.alert("Success", "Second checkbox data saved successfully");
      navigation.navigate("ProjectList");
    } catch (error) {
      console.log("Error save in checkbox:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to save data. Error: " + error.toString()
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!picOpen}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Handover Page</Text>
        <Text style={styles.subText}>Project: {projectCode || "N/A"}</Text>
      </View>

      <View style={[styles.section, { zIndex: picOpen ? 1000 : 1 }]}>
        <Text style={styles.sectionTitle}>Approver</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter approver name..."
          placeholderTextColor="#888"
          value="Atikah"
          editable={false}
        />
        <Text style={styles.sectionTitle2}>PIC Project</Text>

        <View style={{ zIndex: picOpen ? 1001 : 1 }}>
          <DropDownPicker
            open={picOpen}
            value={picValue}
            items={picItems}
            setOpen={setPicOpen}
            setValue={setPicValue}
            setItems={setPicItems}
            searchable={true}
            placeholder="Select PIC Project"
            searchPlaceholder="Search..."
            style={[styles.dropdown, { height: 40 }]}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              { maxHeight: 200, zIndex: picOpen ? 1002 : 0 },
            ]}
            listMode="SCROLLVIEW"
            onOpen={() => setPicOpen(true)}
            onClose={() => setPicOpen(false)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Write your notes here..."
          placeholderTextColor="#888"
          value={handoverNotesInput}
          onChangeText={setHandoverNotesInput}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evidence</Text>
        {isUploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#00CFFF" />
            <Text style={styles.uploadingText}>Uploading photos...</Text>
          </View>
        ) : (
          <>
            {handoverEvidenceFiles.length === 0 ? (
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={handleSelectHandoverEvidence}
              >
                <Text style={styles.uploadButtonText}>Upload Evidence</Text>
              </TouchableOpacity>
            ) : (
              <FlatList
                horizontal
                data={handoverEvidenceFiles}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderEvidenceItem}
                ListFooterComponent={
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={handleSelectHandoverEvidence}
                  >
                    <AntDesign name="plus" size={24} color="white" />
                  </TouchableOpacity>
                }
                contentContainerStyle={styles.evidenceList}
              />
            )}
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.zoomedImage} 
              resizeMode="contain"
            />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <TouchableOpacity 
        style={[
          styles.submitButtonOut, 
          (buttonsDisabled || isUploading) && styles.disabledButton
        ]} 
        onPress={handleSaveAll}
        disabled={buttonsDisabled || isUploading}
      >
        <Text style={styles.submitButtonText}>
          {isUploading ? "Uploading..." : "Update Checklist Out"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity  
        style={[
          styles.submitButtonIn, 
          {marginBottom: 20}, 
          (buttonsDisabled || isUploading) && styles.disabledButton
        ]}  
        onPress={saveAllInCheckbox}
        disabled={buttonsDisabled || isUploading}
      >
        <Text style={styles.submitButtonText}>
          {buttonsDisabled ? 'Checklist In Already Saved' : 
           isUploading ? 'Uploading...' : 'Save Checklist In'}
        </Text>
      </TouchableOpacity>

      <ChecklistNavigator navigation={navigation} currentStep={5} />
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040F2E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  sectionTitle2: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00CFFF",
    marginBottom: 10,
    paddingTop: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    paddingTop: 15,
  },
  itemText: {
    fontSize: 14,
    color: "#E5E5E5",
    flex: 2,
    paddingLeft: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#000",
    flex: 2,
    marginHorizontal: 5,
    height: 50,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#ccc",
    height: 40,
    marginBottom: 15,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
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
  submitButtonOut: {
    backgroundColor: "#FF6B6B",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 5,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonIn: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  evidenceContainer: {
    marginTop: 10,
    minHeight: 120,
  },
  evidenceList: {
    alignItems: 'center',
  },
  evidenceItem: {
    marginRight: 10,
    position: 'relative',
  },
  evidenceImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#00CFFF",
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: "#00CFFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImage: {
    width: windowWidth * 0.9,
    height: windowHeight * 0.8,
  },
});

export default HandoverPage_Db;
