import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useProject } from "./ProjectContext";

const ProjectList = ({ navigation }) => {
  const [projectCodes, setProjectCodes] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [expandedProjectIndex, setExpandedProjectIndex] = useState(null);
  const [equipmentData, setEquipmentData] = useState({});
  const [loadingEquipment, setLoadingEquipment] = useState({});
  const animatedControllers = useRef({});
  const [loading, setLoading] = useState(true);
  const { setProjectCode, setAllEquipmentData } = useProject();
  const [submittedProjects, setSubmittedProjects] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const projectsPerPage = 10;

  // Calculate pagination values
  const totalItems = filteredProjects.length;
  const totalPages = Math.ceil(totalItems / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = Math.min(startIndex + projectsPerPage, totalItems);
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  const checkProjectSubmission = async (projectCode) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // Increased timeout to 5000ms

      const response = await fetch("http://103.163.184.111:3000/uav_database", {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const allUavData = await response.json();
      const normalizedProjectCode = projectCode.trim().toLowerCase();

      return allUavData.some(
        (item) =>
          item.project_code?.trim().toLowerCase() === normalizedProjectCode
      );
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`Request timeout for project: ${projectCode}`);
        return false; // Return false on timeout instead of throwing error
      }
      console.error("Submission check failed:", error);
      return false;
    }
  };

  const loadSubmittedProjects = async (codes = projectCodes) => {
    // Batch check submissions using Promise.allSettled for faster parallel processing
    const promises = codes.map(async (projectCode) => {
      try {
        const isSubmitted = await checkProjectSubmission(projectCode);
        return { projectCode, isSubmitted };
      } catch (error) {
        return { projectCode, isSubmitted: false };
      }
    });

    const results = await Promise.allSettled(promises);
    const status = {};

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { projectCode, isSubmitted } = result.value;
        status[projectCode] = isSubmitted;
      }
    });

    setSubmittedProjects(status);
  };

  const fetchProjectCodes = async () => {
  try {
    // Ambil email dari AsyncStorage
    const storedEmail = await AsyncStorage.getItem('userEmail');
    if (!storedEmail) {
      console.log("No email found in AsyncStorage");
      setLoading(false);
      return;
    }

    // Fetch data users
    const usersResponse = await fetch("http://103.163.184.111:3000/users");
    if (!usersResponse.ok) {
      throw new Error(`HTTP error! status: ${usersResponse.status}`);
    }
    const usersData = await usersResponse.json();

    // Cari user yang emailnya match dengan storedEmail
    const matchedUser = usersData.find(
      user => user.email.trim().toLowerCase() === storedEmail.trim().toLowerCase()
    );

    if (!matchedUser) {
      console.log("No user found with matching email");
      setLoading(false);
      return;
    }

    const userName = matchedUser.name; // Dapatkan nama dari user yang match

    // Lanjutkan dengan fetch data personnel seperti sebelumnya
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const personnelResponse = await fetch("http://103.163.184.111:3000/personnel", {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!personnelResponse.ok) {
      throw new Error(`HTTP error! status: ${personnelResponse.status}`);
    }

    const personnelData = await personnelResponse.json();

    let matchedProjects;

    if (
      userName.trim().toLowerCase() === "atikah" ||
      userName.trim().toLowerCase() === "jolin tiomar" ||
      userName.trim().toLowerCase() === "rizqi"
    ) {
      matchedProjects = personnelData;
    } else {
      matchedProjects = personnelData.filter(
        (item) =>
          item.personnel_name.trim().toLowerCase() ===
          userName.trim().toLowerCase()
      );
    }

    const codes = matchedProjects.map((item) => item.project_code);
    const uniqueCodes = Array.from(new Set(codes));

    setProjectCodes(uniqueCodes);
    setFilteredProjects(uniqueCodes);

    // Load submitted projects with improved error handling
    if (uniqueCodes.length > 0) {
      await loadSubmittedProjects(uniqueCodes);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Personnel fetch timeout - using cached data if available");
    } else {
      console.log("Error fetching project codes: ", error);
    }
  } finally {
    setLoading(false);
  }
};

  // const fetchProjectCodes = async () => {
  //   try {
  //     const name = await AsyncStorage.getItem("userName");
  //     if (name) {
  //       const controller = new AbortController();
  //       const timeout = setTimeout(() => controller.abort(), 5000); // Increased timeout

  //       const response = await fetch("http://103.163.184.111:3000/personnel", {
  //         signal: controller.signal,
  //       });

  //       clearTimeout(timeout);

  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }

  //       const data = await response.json();

  //       let matchedProjects;

  //       if (
  //         name.trim().toLowerCase() === "atikah" ||
  //         name.trim().toLowerCase() === "jolin tiomar" ||
  //         name.trim().toLowerCase() === "rizqi"
  //       ) {
  //         matchedProjects = data;
  //       } else {
  //         matchedProjects = data.filter(
  //           (item) =>
  //             item.personnel_name.trim().toLowerCase() ===
  //             name.trim().toLowerCase()
  //         );
  //       }

  //       const codes = matchedProjects.map((item) => item.project_code);
  //       const uniqueCodes = Array.from(new Set(codes));

  //       setProjectCodes(uniqueCodes);
  //       setFilteredProjects(uniqueCodes);

  //       // Load submitted projects with improved error handling
  //       if (uniqueCodes.length > 0) {
  //         await loadSubmittedProjects(uniqueCodes);
  //       }
  //     }
  //   } catch (error) {
  //     if (error.name === "AbortError") {
  //       console.log("Personnel fetch timeout - using cached data if available");
  //     } else {
  //       console.log("Error fetching project codes: ", error);
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchEquipmentForProject = async (projectCode, index) => {
    setLoadingEquipment((prev) => ({ ...prev, [index]: true }));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // Increased timeout

      const response = await fetch(
        "http://103.163.184.111:3000/project_equipment",
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const filteredEquipment = data.filter(
        (item) => item.project_code === projectCode
      );

      const categorizedEquipment = {
        UAV: [],
        Payload: [],
        GPS: [],
        PPE: [],
        Other: [],
      };
      filteredEquipment.forEach((item) => {
        const entry = { name: item.equipment_type, id: item.equipment_id };
        if (categorizedEquipment[item.equipment_name]) {
          categorizedEquipment[item.equipment_name].push(entry);
        } else {
          categorizedEquipment.Other.push(entry);
        }
      });

      setEquipmentData((prev) => ({ ...prev, [index]: categorizedEquipment }));
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`Equipment fetch timeout for project: ${projectCode}`);
      } else {
        console.log("Error fetching equipment: ", error);
      }
      // Set empty equipment data on error
      setEquipmentData((prev) => ({
        ...prev,
        [index]: {
          UAV: [],
          Payload: [],
          GPS: [],
          PPE: [],
          Other: [],
        },
      }));
    } finally {
      setLoadingEquipment((prev) => ({ ...prev, [index]: false }));
    }
  };

  const toggleExpand = async (projectCode, index) => {
    if (!animatedControllers.current[index]) {
      animatedControllers.current[index] = new Animated.Value(0);
    }

    if (expandedProjectIndex === index) {
      Animated.timing(animatedControllers.current[index], {
        toValue: 0,
        duration: 200, // Reduced animation duration for faster response
        useNativeDriver: true,
      }).start(() => setExpandedProjectIndex(null));
    } else {
      if (
        expandedProjectIndex !== null &&
        animatedControllers.current[expandedProjectIndex]
      ) {
        Animated.timing(animatedControllers.current[expandedProjectIndex], {
          toValue: 0,
          duration: 200, // Reduced animation duration
          useNativeDriver: true,
        }).start();
      }

      setExpandedProjectIndex(index);
      if (!equipmentData[index]) {
        await fetchEquipmentForProject(projectCode, index);
      }

      const isSubmitted = await checkProjectSubmission(projectCode);
      setSubmittedProjects((prev) => ({
        ...prev,
        [projectCode]: isSubmitted,
      }));

      Animated.timing(animatedControllers.current[index], {
        toValue: 1,
        duration: 200, // Reduced animation duration
        useNativeDriver: true,
      }).start();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredProjects(projectCodes);
    Keyboard.dismiss();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (query === "") {
      setFilteredProjects(projectCodes);
    } else {
      const filtered = projectCodes.filter((projectCode) =>
        projectCode.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  };

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Optimized refresh handler with better error handling
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Only fetch project codes, submission status will be checked as needed
      await fetchProjectCodes();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      // Add small delay to show refresh animation briefly
      setTimeout(() => {
        setRefreshing(false);
      }, 500); // Slightly longer delay for better UX
    }
  };

  useEffect(() => {
    fetchProjectCodes();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Project List</Text>
      </View>

      <View
        style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused,
        ]}
      >
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search project code..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F3A93" />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : filteredProjects.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Icon name="search-off" size={50} color="#999" />
          <Text style={styles.noResultsText}>No projects found</Text>
          <Text style={styles.noResultsSubText}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#1F3A93"]}
                tintColor="#1F3A93"
                progressViewOffset={0}
                size="default"
              />
            }
          >
            {currentProjects.map((item, index) => {
              const globalIndex = startIndex + index;
              return (
                <View key={globalIndex} style={styles.projectCard}>
                  <TouchableOpacity
                    onPress={() => toggleExpand(item, index)}
                    style={styles.projectHeader}
                  >
                    <View style={styles.projectCodeContainer}>
                      <Icon name="folder" size={20} color="#FFD700" />
                      <Text style={styles.projectCodeText}>{item}</Text>
                    </View>
                    <View style={styles.projectStatusContainer}>
                      {submittedProjects[item] && (
                        <View style={styles.completedBadge}>
                          <Icon name="check-circle" size={16} color="#00FF00" />
                          <Text style={styles.completedText}>Completed</Text>
                        </View>
                      )}
                      <Icon
                        name={
                          expandedProjectIndex === index
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={24}
                        color="#FFF"
                      />
                    </View>
                  </TouchableOpacity>

                  {expandedProjectIndex === index && (
                    <View style={styles.equipmentList}>
                      {loadingEquipment[index] ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        Object.entries(equipmentData[index] || {}).map(
                          ([category, equipmentList]) => (
                            <View key={category} style={styles.categorySection}>
                              <View style={styles.categoryHeader}>
                                <Text style={styles.categoryTitle}>
                                  {category}
                                </Text>
                                <View style={styles.categoryCountBadge}>
                                  <Text style={styles.categoryCountText}>
                                    {equipmentList.length}
                                  </Text>
                                </View>
                              </View>
                              {equipmentList.length > 0 ? (
                                equipmentList.map((equipment, idx) => (
                                  <View key={idx} style={styles.equipmentRow}>
                                    <View style={styles.equipmentInfo}>
                                      <Text style={styles.equipmentItem}>
                                        • {equipment.name}
                                      </Text>
                                      {category === "Other" && (
                                        <View style={styles.subList}>
                                          <Text style={styles.equipmentSubItem}>
                                            ID: {equipment.id}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                ))
                              ) : (
                                <Text style={styles.noEquipmentText}>
                                  No equipment found
                                </Text>
                              )}
                            </View>
                          )
                        )
                      )}
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={[
                            styles.checklistButton,
                            submittedProjects[item] && styles.disabledButton,
                          ]}
                          onPress={() => {
                            if (!submittedProjects[item]) {
                              setProjectCode(item);
                              const simplifiedData = {};
                              Object.entries(
                                equipmentData[index] || {}
                              ).forEach(([category, equipmentList]) => {
                                if (category === "Other") {
                                  simplifiedData[category] = equipmentList.map(
                                    (e) => ({
                                      name: e.name,
                                      id: e.id,
                                    })
                                  );
                                } else {
                                  simplifiedData[category] = equipmentList.map(
                                    (e) => e.name
                                  );
                                }
                              });
                              setAllEquipmentData(simplifiedData);
                              navigation.navigate("UAVPage", {
                                projectCode: item,
                              });
                            }
                          }}
                          disabled={submittedProjects[item]}
                        >
                          <Icon
                            name="checklist"
                            size={18}
                            color={
                              submittedProjects[item] ? "#bdc3c7" : "white"
                            }
                          />
                          <Text
                            style={[
                              styles.checklistButtonText,
                              submittedProjects[item] &&
                                styles.disabledButtonText,
                            ]}
                          >
                            {submittedProjects[item]
                              ? "Submitted"
                              : "Open Checklist"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.checklistButton,
                            !submittedProjects[item] && styles.disabledButton,
                          ]}
                          onPress={() => {
                            if (submittedProjects[item]) {
                              setProjectCode(item);
                              const simplifiedData = {};
                              Object.entries(
                                equipmentData[index] || {}
                              ).forEach(([category, equipmentList]) => {
                                if (category === "Other") {
                                  simplifiedData[category] = equipmentList.map(
                                    (e) => ({
                                      name: e.name,
                                      id: e.id,
                                    })
                                  );
                                } else {
                                  simplifiedData[category] = equipmentList.map(
                                    (e) => e.name
                                  );
                                }
                              });
                              setAllEquipmentData(simplifiedData);
                              navigation.navigate("UAVPage_db", {
                                projectCode: item,
                              });
                            }
                          }}
                          disabled={!submittedProjects[item]}
                        >
                          <Icon
                            name="visibility"
                            size={18}
                            color={
                              !submittedProjects[item] ? "#bdc3c7" : "white"
                            }
                          />
                          <Text
                            style={[
                              styles.checklistButtonText,
                              !submittedProjects[item] &&
                                styles.disabledButtonText,
                            ]}
                          >
                            Show Checklist
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={goToFirstPage}
                  disabled={currentPage === 1}
                  style={[
                    styles.paginationButton,
                    currentPage === 1 && styles.disabledButton,
                  ]}
                >
                  <Icon
                    name="first-page"
                    size={24}
                    color={currentPage === 1 ? "#555" : "#FFF"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={goToPrevPage}
                  disabled={currentPage === 1}
                  style={[
                    styles.paginationButton,
                    currentPage === 1 && styles.disabledButton,
                  ]}
                >
                  <Icon
                    name="chevron-left"
                    size={24}
                    color={currentPage === 1 ? "#555" : "#FFF"}
                  />
                </TouchableOpacity>

                <View style={styles.pageInfoContainer}>
                  <Text style={styles.pageInfoText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={goToNextPage}
                  disabled={currentPage === totalPages}
                  style={[
                    styles.paginationButton,
                    currentPage === totalPages && styles.disabledButton,
                  ]}
                >
                  <Icon
                    name="chevron-right"
                    size={24}
                    color={currentPage === totalPages ? "#555" : "#FFF"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={goToLastPage}
                  disabled={currentPage === totalPages}
                  style={[
                    styles.paginationButton,
                    currentPage === totalPages && styles.disabledButton,
                  ]}
                >
                  <Icon
                    name="last-page"
                    size={24}
                    color={currentPage === totalPages ? "#555" : "#FFF"}
                  />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040F2E",
  },
  header: {
    backgroundColor: "#1F3A93",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2B6D",
    borderRadius: 25,
    paddingHorizontal: 15,
    margin: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#1A2B6D",
  },
  searchContainerFocused: {
    borderColor: "#FFD700",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "white",
    height: 45,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  noResultsSubText: {
    color: "#999",
    fontSize: 14,
    marginTop: 5,
  },
  projectCard: {
    backgroundColor: "#1A2B6D",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  projectCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectCodeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  projectStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 10,
  },
  completedText: {
    color: "#00FF00",
    fontSize: 12,
    marginLeft: 5,
    fontWeight: "bold",
  },
  equipmentList: {
    backgroundColor: "#0F1C4D",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#2A4BA0",
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  categoryCountBadge: {
    backgroundColor: "#1F3A93",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  equipmentRow: {
    backgroundColor: "#2A4BA0",
    borderRadius: 8,
    marginBottom: 5,
    padding: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentItem: {
    color: "white",
    fontSize: 15,
  },
  noEquipmentText: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 14,
    marginTop: 5,
  },
  subList: {
    marginTop: 5,
  },
  equipmentSubItem: {
    color: "#CCCCCC",
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  checklistButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F3A93",
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  disabledButton: {
    backgroundColor: "#0F1C4D",
  },
  checklistButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  disabledButtonText: {
    color: "#bdc3c7",
  },
  bottomSpacer: {
    height: 50,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
  },
  paginationButton: {
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: "#1F3A93",
  },
  disabledButton: {
    backgroundColor: "#0F1C4D",
  },
  pageInfoContainer: {
    marginHorizontal: 15,
  },
  pageInfoText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    marginBottom: 60,
  },
  scrollView: {
    flex: 1,
  },
});

export default ProjectList;
