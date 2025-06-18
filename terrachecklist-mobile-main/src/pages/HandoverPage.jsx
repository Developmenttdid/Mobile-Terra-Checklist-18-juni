import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  LogBox,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import ChecklistNavigator from "../components/ChecklistNav";
import { usePPE } from "./PPEContext";
import { useProject } from "./ProjectContext";
import * as ImagePicker from "expo-image-picker";
import { AntDesign } from "@expo/vector-icons";

LogBox.ignoreLogs([
  "VirtualizedLists should never be nested inside plain ScrollViews",
  "Warning: Text strings must be rendered within a <Text> component.",
]);

const HandoverPage = ({ navigation }) => {
  const {
    projectCode,
    resetChecklistState,
    equipmentInChecked,
    setEquipmentInChecked,
    picValue,
    setPicValue,
    handoverNotesInput,
    setHandoverNotesInput,
    equipmentOutChecked,
    setEquipmentOutChecked,
    uavEquipment,
    UAVcheckedItems,
    setUAVCheckedItems,
    UAVitemNotes,
    setUAVItemNotes,
    UAVnotesInput,
    gpsEquipment,
    gpsCheckedItems,
    setGpsCheckedItems,
    gpsItemNotes,
    setGpsItemNotes,
    gpsNotesInput,
    payloadEquipment,
    payloadCheckedItems,
    setPayloadCheckedItems,
    payloadItemNotes,
    setPayloadItemNotes,
    payloadNotesInput,
    otherEquipment,
    otherCheckedItems,
    setOtherCheckedItems,
    otherItemNotes,
    setOtherItemNotes,
    otherNotesInput,
  } = useProject();

  const [email, setEmail] = useState("");
  const [picOpen, setPicOpen] = useState(false);
  const [picItems, setPicItems] = useState([]);
  const { handleSubmitPPE } = usePPE();

  // Evidence State
  const [handoverEvidenceFiles, setHandoverEvidenceFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  useEffect(() => {
    fetchPICData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("userEmail");
      const savedPicValue = await AsyncStorage.getItem("handoverPIC");
      const savedhandoverNotesInput = await AsyncStorage.getItem("handoverNotesInput");
      const savedOutChecked = await AsyncStorage.getItem("handoveroutCheckedItems");
      const savedInChecked = await AsyncStorage.getItem("handoverinCheckedItems");
      const savedEvidenceFiles = await AsyncStorage.getItem("handoverEvidenceFiles");

      if (savedPicValue !== null) setPicValue(JSON.parse(savedPicValue));
      if (savedhandoverNotesInput !== null) setHandoverNotesInput(JSON.parse(savedhandoverNotesInput));
      if (savedEmail) setEmail(savedEmail);
      if (savedOutChecked !== null) setEquipmentOutChecked(JSON.parse(savedOutChecked));
      if (savedInChecked !== null) setEquipmentInChecked(JSON.parse(savedInChecked));
      if (savedEvidenceFiles) setHandoverEvidenceFiles(JSON.parse(savedEvidenceFiles));
    } catch (error) {
      console.log("Error loading saved data:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSavedData();
    }, [])
  );

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("handoveroutCheckedItems", JSON.stringify(equipmentOutChecked));
        await AsyncStorage.setItem("handoverinCheckedItems", JSON.stringify(equipmentInChecked));
        await AsyncStorage.setItem("handoverPIC", JSON.stringify(picValue));
        await AsyncStorage.setItem("handoverNotesInput", JSON.stringify(handoverNotesInput));
        await AsyncStorage.setItem("handoverEvidenceFiles", JSON.stringify(handoverEvidenceFiles));
      } catch (error) {
        console.log("Error saving data:", error);
      }
    };
    saveData();
  }, [equipmentOutChecked, equipmentInChecked, picValue, handoverNotesInput, handoverEvidenceFiles]);

  // Evidence Handler
  const uploadEvidenceFiles = async () => {
    setIsUploading(true);
    const uploadedFiles = [];
    try {
      for (const file of handoverEvidenceFiles) {
        if (file.uri && file.uri.startsWith('http')) {
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant gallery permission to select photos");
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
  };

  const handleSelectFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera permission to take photos");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets) {
      setHandoverEvidenceFiles(prev => [...prev, result.assets[0]]);
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

  // ===================== SUBMIT FUNCTIONS =====================

  // UAV Submit
  const handleSubmitUav = async () => {
    try {
      if (!projectCode || !email || !uavEquipment || uavEquipment.length === 0) {
      //  alert("Missing project code, email, or no UAV equipment to submit.");
        return;
      }
      const maxCounts = { uav: 20, power_system: 8, gcs: 4, standard_acc: 8 };
      for (let i = 0; i < uavEquipment.length; i++) {
        const uavName = uavEquipment[i];
        const uavPrefix = uavName.toLowerCase().replace(/ /g, "_");
        const payload = {
          project_code: projectCode,
          email: email,
          equipment_uav: uavName,
          notes: UAVnotesInput || null,
        };
        Object.entries(maxCounts).forEach(([section, maxCount]) => {
          for (let j = 1; j <= maxCount; j++) {
            const fullKey = `${uavPrefix}_${section}_${j}`;
            const payloadKey = `${section}_${j}`;
            const noteKey = `${payloadKey}_notes`;
            payload[payloadKey] = UAVcheckedItems[fullKey] ?? null;
            payload[noteKey] = UAVitemNotes[fullKey] ?? null;
          }
        });
        const response = await fetch(
          "http://103.163.184.111:3000/uav_database",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          console.error(`❌ Failed to submit UAV ${uavName}:`, data);
          alert(`Failed to submit ${uavName}: ` + data.message);
          return;
        }
      }
    } catch (error) {
      console.error("❌ Error submitting UAV data:", error);
      alert("Error submitting UAV data");
    }
  };

  // GPS Submit
  const handleSubmitGps = async () => {
    try {
      const savedGpsItems = await AsyncStorage.getItem("gpsCheckedItems");
      const gpsCheckedItems = savedGpsItems ? JSON.parse(savedGpsItems) : {};
      if (!projectCode || !email || !gpsEquipment || gpsEquipment.length === 0) {
        //alert("Missing project code, email, or no GPS equipment to submit");
        return;
      }
      const maxItemCount = 11;
      for (let i = 0; i < gpsEquipment.length; i++) {
        const gpsName = gpsEquipment[i];
        const gpsPrefix = gpsName.toLowerCase().replace(/ /g, "_");
        const relatedItems = Object.entries(gpsCheckedItems)
          .filter(([key]) => key.startsWith(gpsPrefix + "_"))
          .sort(([keyA], [keyB]) => {
            const numA = parseInt(keyA.split("_").pop(), 10);
            const numB = parseInt(keyB.split("_").pop(), 10);
            return numA - numB;
          });
        const formattedItems = {};
        const formattedNotes = {};
        let counter = 1;
        for (const [key, value] of relatedItems) {
          if (counter > maxItemCount) break;
          const itemKey = `item_${counter}`;
          const noteKey = `item_${counter}_notes`;
          formattedItems[itemKey] = typeof value === "boolean" ? value : null;
          formattedNotes[noteKey] = gpsItemNotes[key] || null;
          counter++;
        }
        for (let j = counter; j <= maxItemCount; j++) {
          formattedItems[`item_${j}`] = null;
          formattedNotes[`item_${j}_notes`] = null;
        }
        const payload = {
          project_code: projectCode,
          gps_name: gpsName,
          email: email,
          ...formattedItems,
          ...formattedNotes,
          notes: gpsNotesInput || null,
        };
        const response = await fetch(
          "http://103.163.184.111:3000/gps_database",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          console.error(`❌ Failed to submit GPS ${gpsName}:`, data);
          alert(`Failed to submit ${gpsName}: ` + data.message);
          return;
        }
      }
    } catch (error) {
      console.error("❌ Error submitting GPS data:", error);
      alert("Error submitting GPS data");
    }
  };

  // Payload Submit
  const handleSubmitPayload = async () => {
    try {
      if (!projectCode || !email || !payloadEquipment || payloadEquipment.length === 0) {
        //alert("Missing project code, email, or no payloads to submit");
        return;
      }
      const maxItemCount = 26;
      for (let i = 0; i < payloadEquipment.length; i++) {
        const name = payloadEquipment[i];
        const formattedItems = {};
        const formattedNotes = {};
        let counter = 1;
        const relatedKeys = Object.entries(payloadCheckedItems).filter(
          ([key]) => key.startsWith(name.toLowerCase().replace(/ /g, "_") + "_")
        );
        for (const [key, value] of relatedKeys) {
          if (counter > maxItemCount) break;
          const itemKey = `item_${counter}`;
          const noteKey = `item_${counter}_notes`;
          formattedItems[itemKey] = typeof value === "boolean" ? value : null;
          formattedNotes[noteKey] = payloadItemNotes[key] || null;
          counter++;
        }
        for (let j = counter; j <= maxItemCount; j++) {
          formattedItems[`item_${j}`] = null;
          formattedNotes[`item_${j}_notes`] = null;
        }
        const payload = {
          project_code: projectCode,
          payload_name: name,
          email: email,
          ...formattedItems,
          ...formattedNotes,
          notes: payloadNotesInput || null,
        };
        const response = await fetch(
          "http://103.163.184.111:3000/payload_database",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          console.error(`❌ Failed to submit payload ${name}:`, data);
          alert(`Failed to submit ${name}: ` + data.message);
          return;
        }
      }
    } catch (error) {
      console.error("❌ Error submitting payloads:", error);
      alert("Error submitting payloads");
    }
  };

  // Other Submit
  const handleSubmitOther = async () => {
    try {
      if (!otherEquipment || otherEquipment.length === 0) {
        console.warn("No equipment found.");
        return;
      }
      const payload = [];
      const groupedEquipment = otherEquipment.reduce((acc, item) => {
        const name = item.name || "Unknown Equipment";
        if (!acc[name]) acc[name] = [];
        acc[name].push(item);
        return acc;
      }, {});
      Object.entries(groupedEquipment).forEach(([cardTitle, items]) => {
        items.forEach((item) => {
          const equipmentId = item.id || "Unknown ID";
          const key = `${cardTitle}_${equipmentId}`.toLowerCase().replace(/ /g, "_");
          const isChecked = otherCheckedItems[key] ? "true" : "false";
          payload.push({
            project_code: projectCode,
            email: email,
            other_equipment: cardTitle,
            equipment_id: equipmentId,
            item_1: isChecked,
            item_notes: otherItemNotes[key] || "",
            notes: otherNotesInput || "",
          });
        });
      });
      const response = await fetch(
        "http://103.163.184.111:3000/other_database",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        console.log("✅ All items submitted successfully");
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to submit payload. Server said:", errorText);
      }
    } catch (error) {
      console.error("❗ Submit error:", error);
    }
  };

  // PPE Submit
  const handleSubmitppe = () => {
    if (handleSubmitPPE && typeof handleSubmitPPE === "function") {
      handleSubmitPPE();
    } else {
      Alert.alert("Error", "Submit function belum siap.");
    }
  };

  // Handover Submit (with evidence)
  const handleSubmitHandover = async () => {
    try {
      if (!picValue) {
        alert(" PIC Project are required.");
        return;
      }
      let evidenceUrls = handoverEvidenceFiles.map(file =>
        file.uri && file.uri.startsWith('http') ? file.uri : null
      ).filter(Boolean);
      if (handoverEvidenceFiles.some(file => !file.uri.startsWith('http'))) {
        evidenceUrls = await uploadEvidenceFiles();
      }
      const payload = {
        project_code: projectCode,
        email: email,
        approver: "Atikah",
        pic_project: picValue,
        equipment_out: equipmentOutChecked,
        equipment_in: equipmentInChecked,
        notes: handoverNotesInput || null,
        evidence: evidenceUrls.join(','),
      };
      console.log("Submitting handover payload:", payload);
      const response = await fetch(
        "http://103.163.184.111:3000/handover_database",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (response.ok) {
        console.log("✅ Handover data submitted successfully:", data);
       // alert("✅ Handover data submitted successfully!");
        setHandoverEvidenceFiles(evidenceUrls.map(uri => ({ uri })));
      } else {
        console.error("❌ Failed to submit handover data:", data);
        alert("Failed to submit handover data: " + data.message);
      }
    } catch (error) {
      console.error("❌ Error submitting handover data:", error);
      alert("Error submitting handover data.");
    }
  };

  const resetAllStates = () => {
  // Reset all state variables
  setEquipmentInChecked({});
  setEquipmentOutChecked({});
  setPicValue(null);
  setHandoverNotesInput("");
  setHandoverEvidenceFiles([]);
  
  // Reset UAV states
  setUAVCheckedItems({});
  setUAVItemNotes({});
  setUAVNotesInput("");
  
  // Reset GPS states
  setGpsCheckedItems({});
  setGpsItemNotes({});
  setGpsNotesInput("");
  
  // Reset Payload states
  setPayloadCheckedItems({});
  setPayloadItemNotes({});
  setPayloadNotesInput("");
  
  // Reset Other Equipment states
  setOtherCheckedItems({});
  setOtherItemNotes({});
  setOtherNotesInput("");
  
  // Clear AsyncStorage
  AsyncStorage.multiRemove([
    "handoveroutCheckedItems",
    "handoverinCheckedItems",
    "handoverPIC",
    "handoverNotesInput",
    "handoverEvidenceFiles",
    "uavCheckedItems",
    "uavItemNotes",
    "uavNotesInput",
    "gpsCheckedItems",
    "gpsItemNotes",
    "gpsNotesInput",
    "payloadCheckedItems",
    "payloadItemNotes",
    "payloadNotesInput",
    "otherCheckedItems",
    "otherItemNotes",
    "otherNotesInput"
  ]).catch(error => {
    console.log("Error clearing AsyncStorage:", error);
  });
  
  console.log("✅ All states have been reset");
};

  // Submit All
  const handleSubmitAll = async () => {
    try {
      await handleSubmitUav();
      await handleSubmitGps();
      await handleSubmitPayload();
      await handleSubmitPPE();
      await handleSubmitOther();
      await handleSubmitHandover();
      resetChecklistState(); // dari useProject
  
      console.log("🚀 resetChecklistState called after submit");
      Alert.alert("Success", "✅ All data submitted successfully!");
      navigation.navigate("ProjectList");
    } catch (error) {
      console.error("❌ Error submitting all data:", error);
      Alert.alert("Error", "Failed to submit data. Please check again.");
    }
  };

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

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
        />
      </View>

      {/* Evidence Section */}
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
          style={styles.submitButton}
          onPress={handleSelectHandoverEvidence}
        >
          <Text style={styles.submitButtonText}>Upload Evidence</Text>
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
      {/* End Evidence Section */}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAll}>
        <Text style={styles.submitButtonText}>Submit All</Text>
      </TouchableOpacity>
      <ChecklistNavigator navigation={navigation} currentStep={5} />
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
  notFoundText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
    textAlign: "center",
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
  evidenceList: { alignItems: 'center' },
  evidenceItem: { marginRight: 10, position: 'relative' },
  evidenceImage: { width: 100, height: 100, borderRadius: 8 },
  addButton: {
    width: 100, height: 100, borderRadius: 8, backgroundColor: "#00CFFF",
    justifyContent: 'center', alignItems: 'center', marginLeft: 5,
  },
  deleteButton: {
    position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,0,0,0.7)',
    borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
  },
  uploadingContainer: { height: 120, justifyContent: 'center', alignItems: 'center' },
  uploadingText: { color: '#FFFFFF', marginTop: 10 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  zoomedImage: { width: Dimensions.get('window').width * 0.9, height: Dimensions.get('window').height * 0.8 },
});

export default HandoverPage;