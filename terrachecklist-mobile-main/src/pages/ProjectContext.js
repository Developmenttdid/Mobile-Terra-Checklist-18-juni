import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState } from "react";

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projectCode, setProjectCode] = useState("");
  const [uavEquipment, setUavEquipment] = useState([]);
  const [payloadEquipment, setPayloadEquipment] = useState([]);
  const [gpsEquipment, setGpsEquipment] = useState([]);
  const [otherEquipment, setOtherEquipment] = useState([]);
  const [ppeName, setPpeName] = useState([]);
  const [email, setEmail] = useState("");

  //payload
  const [payloadCheckedItems, setPayloadCheckedItems] = useState({});
  const [payloadItemNotes, setPayloadItemNotes] = useState({});
  const [payloadNotesInput, setPayloadNotesInput] = useState("");

  //gps
  const [gpsCheckedItems, setGpsCheckedItems] = useState({});
  const [gpsItemNotes, setGpsItemNotes] = useState({});
  const [gpsNotesInput, setGpsNotesInput] = useState("");

  // UAV
  const [UAVcheckedItems, setUAVCheckedItems] = useState({});
  const [UAVitemNotes, setUAVItemNotes] = useState({});
  const [UAVnotesInput, setUAVNotesInput] = useState("");

  // PPE
  const [ppeCheckedItems, setPpeCheckedItems] = useState({});
  const [ppeItemNotes, setPpeItemNotes] = useState({});
  const [ppeNotesInput, setPpeNotesInput] = useState("");

  //OTHER
  const [otherCheckedItems, setOtherCheckedItems] = useState({});
  const [otherItemNotes, setOtherItemNotes] = useState({});
  const [otherNotesInput, setOtherNotesInput] = useState("");

  //Handover 
  const [equipmentOutChecked, setEquipmentOutChecked] = useState(false);
  const [equipmentInChecked, setEquipmentInChecked] = useState(false);
  const [picValue, setPicValue] = useState(null);
  const [handoverNotesInput, setHandoverNotesInput] = useState("");

  const [shouldReset, setShouldReset] = useState(false);

  // Function to reset all state variables
  const resetState = () => {
    setProjectCode("");
    setUavEquipment([]);
    setPayloadEquipment([]);
    setGpsEquipment([]);
    setOtherEquipment([]);
    setPpeName([]);
    setPayloadItemNotes({});
    setPayloadNotesInput("");
    setGpsItemNotes({});
    setGpsNotesInput("");
    setUAVItemNotes({});
    setUAVNotesInput("");
    setHandoverNotesInput("");
    setPicValue(null);
    setEquipmentOutChecked(false);
    setEquipmentInChecked(false);
    console.log("ProjectContext state reset to initial values.");
  };

  const setAllEquipmentData = (data) => {
    setUavEquipment(data.UAV || []);
    setPayloadEquipment(data.Payload || []);
    setGpsEquipment(data.GPS || []);
    setOtherEquipment(data.Other || []);
    setPpeName(data.PPE || []);
    setPayloadItemNotes(data.payloadItemNotes || {});
    setGpsItemNotes(data.gpsItemNotes || {});
    setUAVItemNotes(data.UAVitemNotes || {});
  };

  const resetChecklistState = async () => {
    try {
      // reset UAV
      setUAVCheckedItems({});
      setUAVItemNotes({});
      setUAVNotesInput("");
      await AsyncStorage.removeItem("UAVcheckedItems");
      await AsyncStorage.removeItem("UAVitemNotes");
      await AsyncStorage.removeItem("UAVnotesInput");

      // reset payload
      setPayloadCheckedItems({});
      setPayloadItemNotes({});
      setPayloadNotesInput("");
      await AsyncStorage.removeItem("payloadCheckedItems");
      await AsyncStorage.removeItem("payloadItemNotes");
      await AsyncStorage.removeItem("payloadNotesInput");

      // reset gps
      setGpsCheckedItems({});
      setGpsItemNotes({});
      setGpsNotesInput("");
      await AsyncStorage.removeItem("gpsCheckedItems");
      await AsyncStorage.removeItem("gpsItemNotes");
      await AsyncStorage.removeItem("gpsNotesInput");

      // reset ppe
      setPpeCheckedItems({});
      setPpeItemNotes({});
      setPpeNotesInput("");
      await AsyncStorage.removeItem("ppeCheckedItems");
      await AsyncStorage.removeItem("ppeItemNotes");
      await AsyncStorage.removeItem("ppeNotesInput");

      // Reset Other
      setOtherCheckedItems({});
      setOtherItemNotes({});
      setOtherNotesInput("");
      await AsyncStorage.removeItem("otherCheckedItems");
      await AsyncStorage.removeItem("otherItemNotes");
      await AsyncStorage.removeItem("otherNotesInput");

      // Reset Handover
      setEquipmentOutChecked(false);
      setEquipmentInChecked(false);
      setPicValue(null);
      setHandoverNotesInput("");
      await AsyncStorage.removeItem("equipmentOutChecked");
      await AsyncStorage.removeItem("equipmentInChecked");
      await AsyncStorage.removeItem("picValue");
      await AsyncStorage.removeItem("handoverNotesInput");

      console.log("🧹 state & storage berhasil di-reset");
    } catch (error) {
      console.error("❌ Error saat reset UAV state/storage:", error);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projectCode,
        setProjectCode,
        email,
        setEmail,
        uavEquipment,
        payloadEquipment,
        gpsEquipment,
        otherEquipment,
        ppeName,
        setAllEquipmentData,
        UAVitemNotes,
        setUAVItemNotes,
        UAVnotesInput,
        setUAVNotesInput,
        UAVcheckedItems,
        setUAVCheckedItems,
        resetState,
        resetChecklistState,
        payloadCheckedItems,
        setPayloadCheckedItems,
        payloadItemNotes,
        setPayloadItemNotes,
        payloadNotesInput,
        setPayloadNotesInput,
        gpsItemNotes,
        setGpsItemNotes,
        gpsNotesInput,
        setGpsNotesInput,
        gpsCheckedItems,
        setGpsCheckedItems,
        ppeCheckedItems,
        setPpeCheckedItems,
        ppeItemNotes,
        setPpeItemNotes,
        ppeNotesInput,
        setPpeNotesInput,
        otherCheckedItems,
        setOtherCheckedItems,
        otherItemNotes,
        setOtherItemNotes,
        otherNotesInput,
        setOtherNotesInput,
        equipmentOutChecked,
        setEquipmentOutChecked,
        equipmentInChecked,
        setEquipmentInChecked,
        picValue,
        setPicValue,
        handoverNotesInput,
        setHandoverNotesInput,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);

