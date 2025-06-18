import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For custom checkbox icons

const ProjectList = ({ navigation }) => {
  const [expandedCategory, setExpandedCategory] = useState(null); // Track which category is expanded
  const categories = ["UAV", "PAYLOAD", "GPS", "PPE", "OTHER"]; // Define categories
  const [loadingEquipment, setLoadingEquipment] = useState(false); // Simulate loading state
  const [equipmentData, setEquipmentData] = useState({
    UAV: [],
    PAYLOAD: [],
    GPS: [],
    PPE: [],
    OTHER: [],
  });
  const [selectedItems, setSelectedItems] = useState({}); // Track selected items

  // Fetch equipment data from the API
  const fetchEquipmentData = async () => {
    try {
      setLoadingEquipment(true);
      const response = await fetch("http://103.163.184.111:3000/equipment_database");
      const data = await response.json();

      // Process data for each category
      const uavData = data.filter((item) => item.drone_type).map((item) => ({ name: item.drone_type }));
      const payloadData = data.filter((item) => item.payload_type).map((item) => ({ name: item.payload_type }));
      const gpsData = data.filter((item) => item.gps_type).map((item) => ({ name: item.gps_type }));
      const ppeData = data.filter((item) => item.ppe_type).map((item) => ({ name: item.ppe_type }));
      const otherData = data.filter((item) => item.other_type).map((item) => ({ name: item.other_type }));

      // Update state with the fetched data
      setEquipmentData({
        UAV: uavData,
        PAYLOAD: payloadData,
        GPS: gpsData,
        PPE: ppeData,
        OTHER: otherData,
      });
    } catch (error) {
      console.error("Error fetching equipment data:", error);
    } finally {
      setLoadingEquipment(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchEquipmentData();
  }, []);

  const toggleExpand = (category) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const toggleItemSelection = (category, itemName) => {
    setSelectedItems((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [itemName]: !prev[category]?.[itemName],
      },
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>Checklist Template</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {categories.map((category, index) => (
          <View key={index} style={styles.accordionContainer}>
            {/* Accordion Header */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleExpand(category)}
            >
              <Text style={styles.accordionHeaderText}>{category}</Text>
              <Text style={styles.accordionToggle}>
                {expandedCategory === category ? "-" : "+"}
              </Text>
            </TouchableOpacity>

            {/* Accordion Content */}
            {expandedCategory === category && (
              <View style={styles.accordionContent}>
                {loadingEquipment ? (
                  <ActivityIndicator size="small" color="white" />
                ) : equipmentData[category]?.length > 0 ? (
                  equipmentData[category].map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.equipmentItem}> {item.name}</Text>
                      <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => toggleItemSelection(category, item.name)}
                      >
                        {selectedItems[category]?.[item.name] ? (
                          <Ionicons name="checkbox" size={24} color="green" />
                        ) : (
                          <Ionicons name="square-outline" size={24} color="white" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noEquipmentText}>
                    No equipment found
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={{ height: 100 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040F2E',
    padding: 10,
  },
  header: {
    backgroundColor: 'white',
    height: 80,
    justifyContent: 'center',
  },
  text: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
    margin: 20,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 20,
  },
  accordionContainer: {
    marginBottom: 10,
    backgroundColor: '#1F3A93',
    borderRadius: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2A4BA0',
  },
  accordionHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accordionToggle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accordionContent: {
    padding: 15,
    backgroundColor: '#2A4BA0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  equipmentItem: {
    color: '#E5E5E5',
    fontSize: 16,
    flex: 1,
  },
  checkbox: {
    padding: 5,
  },
  noEquipmentText: {
    color: 'white',
    fontStyle: 'italic',
  },
});

export default ProjectList;