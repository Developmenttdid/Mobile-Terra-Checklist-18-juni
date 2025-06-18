import React, { createContext, useContext, useState, useEffect } from 'react';
import { useProject } from "../ProjectContext";
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Create the context
const SaveContext = createContext();

// 2. Create the provider 
export const SaveProvider = ({ children }) => {
  // uav
  const [uavChecklistData, setUavChecklistData] = useState(null);
   const [uavCheckedItems, setUavCheckedItems] = useState({}); // checkbox tiap item
    const [uavItemNotes, setUavItemNotes] = useState({}); // notes tiap item
    const [uavNotesInput, setUavNotesInput] = useState(""); //notes keseluruhan
    const [isUavEdited, setIsUavEdited] = useState(false);
    const [isUavSaving, setIsUavSaving] = useState(false);

    // gps
    const [gpsChecklistData, setGpsChecklistData] = useState([]);
    const [gpsCheckedItems, setGpsCheckedItems] = useState({});
    const [gpsItemNotes, setGpsItemNotes] = useState({});
    const [gpsNotesInput, setGpsNotesInput] = useState("");
    const [isGpsSaving, setIsGpsSaving] = useState(false);
    const [isGpsEdited, setIsGpsEdited] = useState(false);

    //payload
    const [payloadChecklistData, setPayloadChecklistData] = useState([]);
    const [payloadCheckedItems, setPayloadCheckedItems] = useState({});
      const [payloadItemNotes, setPayloadItemNotes] = useState({});
      const [payloadNotesInput, setPayloadNotesInput] = useState("");
      const [isPayloadSaving, setIsPayloadSaving] = useState(false);
      const [isPayloadEdited, setIsPayloadEdited] = useState(false);

      //ppe
      const [ppeCheckedItems, setPpeCheckedItems] = useState({});
        const [ppeItemNotes, setPpeItemNotes] = useState({});
        const [ppeNotesInput, setPpeNotesInput] = useState('');
        const [isPpeSaving, setIsPpeSaving] = useState(false);
        const [isPpeEdited, setIsPpeEdited] = useState(false);
        const [dbRows, setDbRows] = useState([]);
        const { ppeName } = useProject();

        // other
        const [otherCheckedItems, setOtherCheckedItems] = useState({});
          const [otherItemNotes, setOtherItemNotes] = useState({});
          const [otherNotesInput, setOtherNotesInput] = useState('');
          const [otherDbRows, setOtherDbRows] = useState([]);
          const [isOtherSaving, setIsOtherSaving] = useState(false);
          const [isOtherEdited, setIsOtherEdited] = useState(false);

  const [email, setEmail] = useState('');

  const { projectCode, uavEquipment  } = useProject(); // Ambil dari context Project

  // Ambil email dari AsyncStorage saat mount
  useEffect(() => {
    const fetchEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    };
    fetchEmail();
  }, []);

  // v1
  // // upadte yang UAV
  //   const handleUavSave = async () => {
  //     setIsUavSaving(true);
  //     try {
  //       const saveData = uavChecklistData.map((equipment) => {
  //         const data = {
  //           timestamp: new Date().toISOString(),
  //           project_code: projectCode,
  //           equipment_uav: equipment.equipment_uav,
  //           notes: uavNotesInput, // notes keseluruhan
  //         };
  //         console.log("equipment: ", equipment);
  //         // Ambil semua key yang relevan
  //         Object.keys(equipment).forEach((key) => {
  //           if (
  //             key.startsWith("uav_") ||
  //             key.startsWith("power_system_") ||
  //             key.startsWith("gcs_") ||
  //             key.startsWith("standard_acc_")
  //           ) {
  //            const formattedEquipmentName = equipment.equipment_uav.toLowerCase().replaceAll(" ", "_");
  //           const mapKey = `${formattedEquipmentName}_${key}`;
  
  //             //const mapKey = `${equipment.equipment_uav}_${key}`;
  //             // const mapKey = key; versi sdb bs
  //             //const mapKey = generateKey(equipment.equipment_uav, key);
  //             data[key] = String(uavCheckedItems[mapKey] || false); // true/false sebagai string
  //             data[`${key}_notes`] = uavItemNotes[mapKey] || ""; // notes per item
  //             console.log("Checking mapKey:", mapKey);
  //             console.log("checkedItems[mapKey]:", uavCheckedItems[mapKey]);
  //             console.log("itemNotes[mapKey]:", uavItemNotes[mapKey]);
  //             console.log("db checked item: ", uavCheckedItems);
  //           }
  //         });
  //         console.log("Prepared data for save:", data);
  //         return data;
  //       });
  
  //       // Kirim data: PUT kalau ada, POST kalau belum
  //       for (const data of saveData) {
  //         const existing = await fetchUavExistingData(
  //           projectCode,
  //           data.equipment_uav
  //         );
  //         if (existing) {
  //           console.log("Updating existing ID:", existing.id); // Tambahkan ini
  //           await fetch(
  //             `http://103.163.184.111:3000/uav_database/${existing.id}`,
  //             {
  //               method: "PUT",
  //               headers: { "Content-Type": "application/json" },
  //               body: JSON.stringify(data),
  //             }
  //           );
  //         } else {
  //           await fetch("http://103.163.184.111:3000/uav_database", {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify({ ...data, email: email }),
  //           });
  //         }
  
  //         setIsUavEdited(false);
  
  //       }
  
  //      // alert("Data UAV berhasil diupdate");
  //     } catch (error) {
  //       console.error("Gagal menyimpan data UAV:", error);
  //       alert("Terjadi kesalahan saat menyimpan.");
  //     } finally {
  //       setIsUavSaving(false);
  //     }
  //   };


  // v2
//   const handleUavSave = async () => {
//   setIsUavSaving(true);
//   try {
//     const saveData = uavChecklistData.map((equipment) => {
//       const data = {
//        // timestamp: new Date().toISOString(),
//         project_code: projectCode,
//         equipment_uav: equipment.equipment_uav,
//         notes: uavNotesInput || "",
//       };

//       // Daftar kolom yang diperbolehkan
//       const allowedFields = {
//         uav: Array.from({length: 20}, (_, i) => `uav_${i+1}`),
//         power_system: Array.from({length: 8}, (_, i) => `power_system_${i+1}`),
//         gcs: Array.from({length: 4}, (_, i) => `gcs_${i+1}`),
//         standard_acc: Array.from({length: 8}, (_, i) => `standard_acc_${i+1}`)
//       };

//       // Tambahkan field yang diizinkan beserta notes-nya
//       Object.keys(allowedFields).forEach(prefix => {
//         allowedFields[prefix].forEach(field => {
//           const formattedEquipmentName = equipment.equipment_uav.toLowerCase().replaceAll(" ", "_");
//           const mapKey = `${formattedEquipmentName}_${field}`;
          
//           // Tambahkan field utama
//           if (uavCheckedItems[mapKey] !== undefined) {
//             data[field] = String(uavCheckedItems[mapKey] || "false");
//           }
          
//           // Tambahkan notes jika ada
//           const notesKey = `${mapKey}_notes`;
//           if (uavItemNotes[notesKey] !== undefined) {
//             data[`${field}_notes`] = uavItemNotes[notesKey] || "";
//           }
//         });
//       });

//       console.log("Prepared data for save:", data);
//       return data;
//     });

//     // Kirim data ke backend
//     for (const data of saveData) {
//       const existing = await fetchUavExistingData(projectCode, data.equipment_uav);
//       const url = existing 
//         ? `http://103.163.184.111:3000/uav_database/${existing.id}`
//         : "http://103.163.184.111:3000/uav_database";
      
//       const method = existing ? "PUT" : "POST";
      
//       await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(existing ? data : {...data, email}),
//       });
//     }

//     setIsUavEdited(false);
//     alert("Data UAV berhasil diupdate");
//   } catch (error) {
//     console.error("Gagal menyimpan data UAV:", error);
//     alert("Terjadi kesalahan saat menyimpan.");
//   } finally {
//     setIsUavSaving(false);
//   }
// };

// update yang UAV
const handleUavSave = async () => {
  setIsUavSaving(true);
  try {
    const saveData = uavChecklistData.map((equipment) => {
      const data = {
        timestamp: new Date().toISOString(),
        project_code: projectCode,
        equipment_uav: equipment.equipment_uav,
        notes: uavNotesInput, // notes keseluruhan
      };
      
      console.log("equipment: ", equipment);
      
      // Fungsi untuk menambahkan item dan notes sesuai batas maksimum
      const addItemsWithLimit = (prefix, max) => {
        for (let i = 1; i <= max; i++) {
          const key = `${prefix}_${i}`;
          const formattedEquipmentName = equipment.equipment_uav.toLowerCase().replaceAll(" ", "_");
          const mapKey = `${formattedEquipmentName}_${key}`;
          
          data[key] = String(uavCheckedItems[mapKey] || false);
          data[`${key}_notes`] = uavItemNotes[mapKey] || "";
          
          console.log("Checking mapKey:", mapKey);
          console.log("checkedItems[mapKey]:", uavCheckedItems[mapKey]);
          console.log("itemNotes[mapKey]:", uavItemNotes[mapKey]);
        }
      };
      
      // Tambahkan item sesuai batas yang ditentukan
      addItemsWithLimit("uav", 20);
      addItemsWithLimit("gcs", 4);
      addItemsWithLimit("power_system", 8);
      addItemsWithLimit("standard_acc", 8);
      
      console.log("Prepared data for save:", data);
      return data;
    });
    
    // Kirim data: PUT kalau ada, POST kalau belum
    for (const data of saveData) {
      const existing = await fetchUavExistingData(
        projectCode,
        data.equipment_uav
      );
      if (existing) {
        console.log("Updating existing ID:", existing.id);
        await fetch(
          `http://103.163.184.111:3000/uav_database/${existing.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
      } else {
        await fetch("http://103.163.184.111:3000/uav_database", {
          method: "POST",
          headers: { "Content-Type" : "application/json" },
          body: JSON.stringify({ ...data, email: email }),
        });
      }
      
      setIsUavEdited(false);
    }
    
    // alert("Data UAV berhasil diupdate");
  } catch (error) {
    console.error("Gagal menyimpan data UAV:", error);
    alert("Terjadi kesalahan saat menyimpan.");
  } finally {
    setIsUavSaving(false);
  }
};
  
    const fetchUavExistingData = async (projectCode, uavName) => {
      try {
        const trimmedProjectCode = projectCode.trim();
        const trimmedUavName = uavName.trim();
        console.log("uavname: ", trimmedUavName); //hasil ud sesuai
        console.log("projectcode: ", trimmedProjectCode);
  
        const params = new URLSearchParams({
          project_code: trimmedProjectCode,
          equipment_uav: trimmedUavName,
        });
  
        const url = `http://103.163.184.111:3000/uav_database?${params.toString()}`;
        // console.log("Fetching from URL:", url);
  
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
        const data = await response.json();
        //console.log("Fetched data for lookup:", data);
  
        if (!Array.isArray(data) || data.length === 0) return null;
  
        // Filter data yang cocok dan memiliki ID
        const valid = data.filter(
          (d) =>
            d.id &&
            d.project_code === trimmedProjectCode &&
            d.equipment_uav === trimmedUavName
        );
        if (valid.length === 0) return null;
  
        // Ambil data dengan timestamp terbaru
        const latest = valid.reduce((a, b) =>
          new Date(a.timestamp) > new Date(b.timestamp) ? a : b
        );
  
        // console.log("Latest matching data:", latest);
        return latest;
      } catch (err) {
        console.error("Error in fetchUavExistingData:", err);
        return null;
      }
    };

    // update yang GPS
    const handleGpsSave = async () => {
      const normalizeKey = (str) => str.toLowerCase().replace(/\s+/g, "_");
      setIsGpsSaving(true);
      try {
        // Format data untuk setiap GPS equipment
        const saveData = gpsChecklistData.map((gps) => {
          const data = {
            timestamp: new Date().toISOString(), // Timestamp selalu diperbarui
            project_code: projectCode,
            gps_name: gps.gps_name,
            notes: gpsNotesInput, // Notes keseluruhan
          };
  
          // Tambahkan hanya item checklist dan notes
          Object.keys(gps)
            .filter((key) => key.startsWith("item_") && gps[key])
            .forEach((key) => {
              const mapKey = normalizeKey(`${gps.gps_name}_${key}`);
              data[key] = gpsCheckedItems[mapKey] || false; // Nilai checkbox
              data[`${key}_notes`] = gpsItemNotes[mapKey] || ""; // Notes per item
              console.log("mapkey: ", mapKey);
              console.log("checked item: ", gpsCheckedItems[mapKey]);
              console.log("item notes: ", gpsItemNotes[mapKey]);
            });
  
          console.log("Prepared data for save:", data); // Log data yang akan dikirim
  
          return data;
        });
  
        // Kirim data ke server untuk setiap GPS equipment
        for (const data of saveData) {
          const existingData = await fetchGpsExistingData(
            projectCode,
            data.gps_name
          );
  
          if (existingData) {
            console.log("Updating existing ID:", existingData.id); // Tambahkan ini
            // PUT untuk update hanya field yang bisa diubah
            await fetch(
              `http://103.163.184.111:3000/gps_database/${existingData.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }
            );
          } else {
            // POST untuk data baru (dengan menyertakan semua field termasuk email)
            await fetch("http://103.163.184.111:3000/gps_database", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...data,
                email: "user@example.com", // Email dari context/state
                project_code: projectCode,
              }),
            });
          }
        }
  
       // Alert.alert("Data Gps berhasil diupdate!");
        // await new Promise((resolve) => setTimeout(resolve, 500)); // Tunggu 500ms
        // await fetchDatabaseData();
      } catch (error) {
        console.error("Error saving Gps data:", error);
        Alert.alert("Error", "Failed to save data");
      } finally {
        setIsGpsSaving(false);
      }
    };
  
    const fetchGpsExistingData = async (projectCode, gpsName) => {
      try {
        const trimmedProjectCode = projectCode.trim();
        const trimmedGpsName = gpsName.trim();
  
        const params = new URLSearchParams({
          project_code: trimmedProjectCode,
          gps_name: trimmedGpsName,
        });
  
        const url = `http://103.163.184.111:3000/gps_database?${params.toString()}`;
        //console.log("Fetching from URL:", url);
  
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
        const data = await response.json();
        //console.log("Fetched data for lookup:", data);
  
        if (!Array.isArray(data) || data.length === 0) return null;
  
        // Filter data yang cocok dan memiliki ID
        const valid = data.filter(
          (d) =>
            d.id &&
            d.project_code === trimmedProjectCode &&
            d.gps_name === trimmedGpsName
        );
        if (valid.length === 0) return null;
  
        // Ambil data dengan timestamp terbaru
        const latest = valid.reduce((a, b) =>
          new Date(a.timestamp) > new Date(b.timestamp) ? a : b
        );
  
       // console.log("Latest matching data:", latest);
        return latest;
      } catch (err) {
        console.error("Error in fetchGpsExistingData:", err);
        return null;
      }
    };

    // update yang payload
    const handlePayloadSave = async () => {
      const normalizeKey = (str) => str.toLowerCase().replace(/\s+/g, "_");
      setIsPayloadSaving(true);
      try {
        // Format data untuk setiap GPS equipment
        const saveData = payloadChecklistData.map((payload) => {
          const data = {
            timestamp: new Date().toISOString(), // Timestamp selalu diperbarui
            project_code: projectCode,
            payload_name: payload.payload_name,
            notes: payloadNotesInput, // Notes keseluruhan
          };
  
          // Tambahkan hanya item checklist dan notes
          Object.keys(payload)
            .filter((key) => key.startsWith("item_") && payload[key])
            .forEach((key) => {
              const mapKey = normalizeKey(`${payload.payload_name}_${key}`);
              data[key] = payloadCheckedItems[mapKey] || false; // Nilai checkbox
              data[`${key}_notes`] = payloadItemNotes[mapKey] || ""; // Notes per item
            });
  
          console.log("Prepared data for save:", data); // Log data yang akan dikirim
  
          return data;
        });
  
        // Kirim data ke server untuk setiap GPS equipment
        for (const data of saveData) {
          const existingData = await fetchPayloadExistingData(
            projectCode,
            data.payload_name
          );
  
          if (existingData) {
            console.log("Updating existing ID:", existingData.id); // Tambahkan ini
            // PUT untuk update hanya field yang bisa diubah
            await fetch(
              `http://103.163.184.111:3000/payload_database/${existingData.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }
            );
          } else {
            // POST untuk data baru (dengan menyertakan semua field termasuk email)
            await fetch("http://103.163.184.111:3000/payload_database", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...data,
                email: email,
                project_code: projectCode,
              }),
            });
          }
        }
  
       // Alert.alert("Data Payload berhasil diupdate");
        // await new Promise((resolve) => setTimeout(resolve, 500)); // Tunggu 500ms
        // await fetchDatabaseData();
      } catch (error) {
        console.error("Error saving data:", error);
        Alert.alert("Error", "Failed to save data");
      } finally {
        setIsPayloadSaving(false);
      }
    };
  
    const fetchPayloadExistingData = async (projectCode, payloadName) => {
      try {
        const trimmedProjectCode = projectCode.trim();
        const trimmedPayloadName = payloadName.trim();
  
        const params = new URLSearchParams({
          project_code: trimmedProjectCode,
          payload_name: trimmedPayloadName,
        });
  
        const url = `http://103.163.184.111:3000/payload_database?${params.toString()}`;
        //console.log("Fetching from URL:", url);
  
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
        const data = await response.json();
       // console.log("Fetched data for lookup:", data);
  
        if (!Array.isArray(data) || data.length === 0) return null;
  
        // Filter data yang cocok dan memiliki ID
        const valid = data.filter(
          (d) =>
            d.id &&
            d.project_code === trimmedProjectCode &&
            d.payload_name === trimmedPayloadName
        );
        if (valid.length === 0) return null;
  
        // Ambil data dengan timestamp terbaru
        const latest = valid.reduce((a, b) =>
          new Date(a.timestamp) > new Date(b.timestamp) ? a : b
        );
  
        console.log("Latest matching data:", latest);
        return latest;
      } catch (err) {
        console.error("Error in fetchPayloadExistingData:", err);
        return null;
      }
    };

    // update yg ppe
    const handlePpeSave = async () => {
      const normalizeKey = (ppeName) => ppeName.toLowerCase().replace(/\s+/g, '_');
      setIsPpeSaving(true);
      try {
       // const email = await AsyncStorage.getItem("userEmail");
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
    
       // Alert.alert("Data PPE berhasil diupdate");
        //fetchDatabaseData(); // Refresh data
      } catch (error) {
        console.error("Save error:", error);
        Alert.alert("Error", error.message || "Failed to save PPE data");
      } finally {
        setIsPpeSaving(false);
      }
    };

    // update yang other
     const handleOtherSave = async () => {
      const normalizeKey = (equip, id) => `${equip}_${id}`.toLowerCase().replace(/\s+/g, '_');
        setIsOtherSaving(true);
        try {
          const email = await AsyncStorage.getItem("userEmail");
          if (!email) throw new Error("User email not found");
      
          // Prepare data for saving
          const saveData =  otherDbRows.map((row) => {
            const key = normalizeKey(row.other_equipment, row.equipment_id);
            return {
              id: row.id, // Include the specific ID of the item
              project_code: projectCode,
              other_equipment: row.other_equipment,
              equipment_id: row.equipment_id,
              item_1: String(otherCheckedItems[key] || false),
              item_notes: otherItemNotes[key] || "",
              notes: otherNotesInput,
              timestamp: new Date().toISOString(),
              email: email,
            };
          });
      
          // Save each item by its specific ID
          for (const data of saveData) {
            if (data.id) {
              // Update existing item
              const response = await fetch(
                `http://103.163.184.111:3000/other_database/${data.id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(data),
                }
              );
      
              if (!response.ok) {
                throw new Error(`Failed to update item with ID: ${data.id}`);
              }
            } else {
              // Handle cases where the item does not have an ID (optional)
              console.warn(`No ID found for item: ${data.other_equipment}`);
            }
          }
      
          //Alert.alert("Data Other berhasil diupdate");
          //fetchDatabaseData(); // Refresh data
        } catch (error) {
          console.error("Save error:", error);
          Alert.alert("Error", error.message || "Failed to save data");
        } finally {
          setIsOtherSaving(false);
        }
      };
  

  return (
    <SaveContext.Provider
      value={{
        uavCheckedItems,
        setUavCheckedItems,
        uavItemNotes,
        setUavItemNotes,
        uavNotesInput,
        setUavNotesInput,
        isUavEdited,
        setIsUavEdited,
        uavChecklistData,
        setUavChecklistData,
        handleUavSave,
        isUavSaving,
        setIsUavSaving,
        gpsCheckedItems,
        setGpsCheckedItems,
        gpsItemNotes,
        setGpsItemNotes,
        gpsNotesInput,
        setGpsNotesInput,
        isGpsSaving,
        setIsGpsSaving,
        gpsChecklistData,
        setGpsChecklistData,
        isGpsEdited,
        setIsGpsEdited,
        handleGpsSave,
        payloadCheckedItems,
        setPayloadCheckedItems,
        payloadItemNotes,
        setPayloadItemNotes,
        payloadNotesInput,
        setPayloadNotesInput,
        payloadChecklistData,
        setPayloadChecklistData,
        isPayloadSaving,
        setIsPayloadSaving,
        isPayloadEdited,
        setIsPayloadEdited,
        handlePayloadSave,
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
        handlePpeSave,
        dbRows,
        setDbRows,
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
        handleOtherSave
      }}
    >
      {children}
    </SaveContext.Provider>
  );
};

// 3. Custom hook for easier access
export const useSaveContext = () => useContext(SaveContext);

