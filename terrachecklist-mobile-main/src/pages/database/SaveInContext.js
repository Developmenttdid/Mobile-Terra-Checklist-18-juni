import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useState } from "react";
import { Alert } from "react-native";
import { useProject } from "../ProjectContext";
import { useSaveContext } from "./SaveContext";

// 1. Create the context
const SaveInContext = createContext();

// 2. Create the Provider
export const SaveInProvider = ({ children }) => {
  const { uavChecklistData, payloadChecklistData, gpsChecklistData } =
    useSaveContext();
  const { projectCode, ppeName, otherEquipment } = useProject();
  const [uavSecondCheckedItems, setUavSecondCheckedItems] = useState({});
  const [payloadSecondCheckedItems, setPayloadSecondCheckedItems] = useState(
    {}
  );
  const [gpsSecondCheckedItems, setGpsSecondCheckedItems] = useState({});
  const [ppeSecondCheckedItems, setPpeSecondCheckedItems] = useState({});
  const [otherSecondCheckedItems, setOtherSecondCheckedItems] = useState({});
  const groupedEquipment = Array.isArray(otherEquipment)
    ? otherEquipment.reduce((acc, item) => {
        const name = item.name;
        if (!acc[name]) acc[name] = [];
        acc[name].push(item);
        return acc;
      }, {})
    : {};

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

  // save UAV in checkbox
  const saveUavSecondCheckboxData = async () => {
    const normalizeKey = (key) => {
      return key
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_") // Ganti semua non-alphanumeric dengan underscore
        .replace(/^_+|_+$/g, "");
    };
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Early exit if no checklist data
      if (!uavChecklistData || uavChecklistData.length === 0) {
      return;
    }

      // Prepare data for each UAV equipment
      const payloads = uavChecklistData.map((uav) => {
        const equipmentName = uav.equipment_uav;
        const payload = {
          email: email,
          project_code: projectCode,
          equipment_uav: equipmentName,
        };

        // Process UAV items
        Object.keys(uav)
          .filter((key) => key.startsWith("uav_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(
              key
            )}`;
            payload[`uav_${index + 1}`] = String(
              uavSecondCheckedItems[fullKey] || false
            );
          });

        // Process Power System items
        Object.keys(uav)
          .filter((key) => key.startsWith("power_system_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(
              key
            )}`;
            payload[`power_system_${index + 1}`] = String(
              uavSecondCheckedItems[fullKey] || false
            );
          });

        // Process GCS items
        Object.keys(uav)
          .filter((key) => key.startsWith("gcs_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(
              key
            )}`;
            payload[`gcs_${index + 1}`] = String(
              uavSecondCheckedItems[fullKey] || false
            );
          });

        // Process Standard Accessories items
        Object.keys(uav)
          .filter((key) => key.startsWith("standard_acc_") && uav[key])
          .forEach((key, index) => {
            const fullKey = `${normalizeKey(equipmentName)}_${normalizeKey(
              key
            )}`;
            payload[`standard_acc_${index + 1}`] = String(
              uavSecondCheckedItems[fullKey] || false
            );
          });

        return payload;
      });

      // Send data to server
      const response = await fetch(
        "http://103.163.184.111:3000/uav_database_in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payloads),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save data");
      }

      const result = await response.json();
      //Alert.alert("Success", "Second checkbox data saved successfully");

      // Clear saved state after successful save
      await AsyncStorage.removeItem(`uavSecondChecks_${projectCode}`);

      return result;
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save second checkbox data"
      );
      throw error;
    }
  };

  // save PAYLOAD in checkbox
  const savePayloadSecondCheckboxData = async () => {
    const normalizeKey = (str) => str.toLowerCase().replace(/\s+/g, "_");
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Early exit if no checklist data
    if (!payloadChecklistData || payloadChecklistData.length === 0) {
      return;
    }

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

      //Alert.alert("Success", "All checkbox data saved successfully");
      return results;
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save checkbox data");
      throw error;
    }
  };

  // Save GPS in checkbox
  const saveGpsSecondCheckboxData = async () => {
    const normalizeKey = (str) => str.toLowerCase().replace(/\s+/g, "_");
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Early exit if no checklist data
    if (!gpsChecklistData || gpsChecklistData.length === 0) {
      return;
    }

      // Prepare data for each GPS section
      const payloads = gpsChecklistData.map((gps) => {
        // Get all valid items for this GPS section
        const validItems = Object.keys(gps).filter(
          (key) => key.startsWith("item_") && gps[key]
        );

        // Create payload with dynamic items
        const payload = {
          email: email,
          project_code: projectCode,
          gps_name: gps.gps_name,
        };

        // Add checkbox values for each existing item
        validItems.forEach((key, index) => {
          const mapKey = normalizeKey(`${gps.gps_name}_${key}`);
          payload[`item_${index + 1}`] = String(
            gpsSecondCheckedItems[mapKey] || "false"
          );
        });

        return payload;
      });

      // Send requests
      const results = await Promise.all(
        payloads.map((payload) =>
          fetch("http://103.163.184.111:3000/gps_database_in", {
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

     // Alert.alert("Success", "All checkbox data saved successfully");
      return results;
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save checkbox data");
      throw error;
    }
  };

  // Save PPE in checkbox
  const savePpeSecondCheckboxData = async () => {
    const normalizeKey = (ppeName) =>
      ppeName.toLowerCase().replace(/\s+/g, "_");
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Early exit if no PPE data
    if (!ppeName || ppeName.length === 0) {
      return;
    }

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

      //Alert.alert("Success", "Second checkbox data saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save second checkbox data"
      );
    }
  };

  // Save OTHER in checkbox
  const saveOtherSecondCheckboxData = async () => {
    const normalizeKey = (equip, id) =>
      `${equip}_${id}`.toLowerCase().replace(/\s+/g, "_");

    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) throw new Error("User email not found");

      // Early exit if no equipment data
    if (!groupedEquipment || Object.keys(groupedEquipment).length === 0) {
      return;
    }

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
    //   Alert.alert(
    //     "Success",
    //     result.message || "Checkbox data saved successfully"
    //   );

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
  
  // to clear states from local storage & async storage
const clearAllSecondCheckboxStates = async () => {
  try {
    // Clear local states
    setUavSecondCheckedItems({});
    setPayloadSecondCheckedItems({});
    setGpsSecondCheckedItems({});
    setPpeSecondCheckedItems({});
    setOtherSecondCheckedItems({});

    // Clear AsyncStorage for all pages
    await Promise.all([
      AsyncStorage.removeItem(`uavSecondChecks_${projectCode}`),
      AsyncStorage.removeItem(`payloadSecondChecks_${projectCode}`),
      AsyncStorage.removeItem(`gpsSecondChecks_${projectCode}`),
      AsyncStorage.removeItem(`ppeSecondChecks_${projectCode}`),
      AsyncStorage.removeItem(`otherSecondChecks_${projectCode}`),
    ]);
    
    console.log("All second checkbox states cleared successfully");
  } catch (error) {
    console.error("Error clearing second checkbox states:", error);
    throw error;
  }
};

  return (
    <SaveInContext.Provider
      value={{
        uavSecondCheckedItems,
        setUavSecondCheckedItems,
        saveUavSecondCheckboxData,
        payloadSecondCheckedItems,
        setPayloadSecondCheckedItems,
        savePayloadSecondCheckboxData,
        gpsSecondCheckedItems,
        setGpsSecondCheckedItems,
        saveGpsSecondCheckboxData,
        ppeSecondCheckedItems,
        setPpeSecondCheckedItems,
        savePpeSecondCheckboxData,
        otherSecondCheckedItems,
        setOtherSecondCheckedItems,
        saveOtherSecondCheckboxData,
        clearAllSecondCheckboxStates,
        buttonsDisabled,
        setButtonsDisabled,
      }}
    >
      {children}
    </SaveInContext.Provider>
  );
};

// 3. Custom hook for easier access
export const useSaveInContext = () => useContext(SaveInContext);



