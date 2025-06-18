import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  Pressable, 
  ScrollView, 
  TextInput, 
  Alert, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProjectContext } from '../ProjectContext';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const Profile = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [imageUri, setImageUri] = useState("https://www.bootdey.com/img/Content/avatar/avatar3.png");
  const [isLoading, setIsLoading] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const { resetState } = useContext(ProjectContext);

  useEffect(() => {
    const fetchUserData = async () => {
  try {
    setIsLoading(true);
    const storedEmail = await AsyncStorage.getItem('userEmail');
    console.log('Stored Email:', storedEmail); // Debug log
    
    if (!storedEmail) {
      Alert.alert("Error", "No email found in AsyncStorage");
      setIsLoading(false);
      return;
    }
    setEmail(storedEmail);

    // Fetch user data
    const response = await fetch(`http://103.163.184.111:3000/users?email=${encodeURIComponent(storedEmail)}`);
    const data = await response.json();
    console.log('API Response:', data); // Debug log
    
    if (data.error) {
      throw new Error(data.error);
    }

    const userData = Array.isArray(data) ? 
      data.find(user => user.email.trim().toLowerCase() === storedEmail.trim().toLowerCase()) : 
      data;
    console.log('Filtered User Data:', userData); // Debug log
    
    if (userData) {
      setName(userData.name || '');
      setDepartment(userData.department || '');
      setPosition(userData.position || '');
      await AsyncStorage.setItem('userName', userData.name || '');
    } else {
      console.log('No user data found for email:', storedEmail);
    }

    // Load profile image
    await loadProfileImage(storedEmail);
  } catch (error) {
    console.error("Fetch error:", error);
    Alert.alert("Error", error.message || "Failed to fetch user data");
  } finally {
    setIsLoading(false);
  }
};

    fetchUserData();
  }, []);

  const loadProfileImage = async (email) => {
    try {
      const timestamp = Date.now();
      const imageResponse = await fetch(
        `http://103.163.184.111:3000/profile-image?email=${encodeURIComponent(email)}&v=${timestamp}`
      );
      
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch profile image');
      }

      const imageData = await imageResponse.json();
      
      if (imageData.exists && imageData.imageUrl) {
        const fullImageUrl = `http://103.163.184.111:3000${imageData.imageUrl}?v=${timestamp}`;
        setImageUri(fullImageUrl);
      } else {
        setImageUri(`https://www.bootdey.com/img/Content/avatar/avatar3.png?v=${timestamp}`);
      }
    } catch (error) {
      console.log("Profile image error:", error);
      setImageUri(`https://www.bootdey.com/img/Content/avatar/avatar3.png?v=${Date.now()}`);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission required", "We need access to your photos to upload a profile picture");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri) => {
    try {
      setIsLoading(true);
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (!storedEmail) {
        throw new Error('No email found');
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Selected file does not exist');
      }

      const fileExt = uri.split('.').pop();
      const fileName = `profile_${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append('profileImage', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      });
      formData.append('email', storedEmail);

      const response = await axios.post(
        'http://103.163.184.111:3000/upload-profile', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Cache-Control': 'no-cache'
          },
          timeout: 15000,
        }
      );

      if (response.data.success && response.data.imageUrl) {
        const newUrl = `http://103.163.184.111:3000${response.data.imageUrl}?v=${Date.now()}`;
        setImageUri(newUrl);
        setImageVersion(prev => prev + 1);
        
        Alert.alert("Success", "Profile photo updated successfully", [
          { text: "OK", onPress: () => loadProfileImage(storedEmail) }
        ]);
      } else {
        throw new Error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload profile photo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      resetState();
      navigation.replace('Login');
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#57b9ff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profilephotocont}>
        <Image
          style={styles.avatar}
          source={{ uri: `${imageUri}&v=${imageVersion}` }}
          key={`${imageUri}-${imageVersion}`}
          onError={(e) => {
            console.log('Image load error:', e.nativeEvent.error);
            setImageUri(`https://www.bootdey.com/img/Content/avatar/avatar3.png?v=${Date.now()}`);
          }}
        />
      </View>
      <View style={styles.profilecard}>
        <TouchableOpacity 
          style={styles.changeAvatarButton} 
          onPress={pickImage}
          disabled={isLoading}
        >
          <Text style={styles.changeAvatarButtonText}>
            {isLoading ? 'Uploading...' : 'Change Photo'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.profiletext}>User Profile</Text>
        <ScrollView 
          style={styles.scrollcontainer} 
          contentContainerStyle={styles.scrollViewContent}
        >
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Name"
            value={name}
            onChangeText={setName}
            editable={false}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Email"
            value={email}
            onChangeText={setEmail}
            editable={false}
          />
          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Department"
            value={department}
            onChangeText={setDepartment}
            editable={false}
          />
          <Text style={styles.label}>Position</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Position"  
            value={position}
            onChangeText={setPosition}
            editable={false}
          />
          <Pressable style={styles.submitButton}>
            <Text style={styles.submittext}>User Database</Text>
          </Pressable>
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <Icon name="logout" size={24} color="white" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
          
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040F2E',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  profiletext: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    top: 90,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  profilecard: {
    position: 'absolute',
    top: 130,
    alignItems: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: '#040F2E',
    borderRadius: 90,
  },
  profilephotocont: {
    position: 'absolute',
    top: 60,
    height: 125,
    width: 125,
    backgroundColor: '#040F2E',
    borderRadius: 62,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollcontainer: {
    position: 'absolute',
    left: 0,
    height: '80%',
    width: '100%',
    backgroundColor: '#040F2E',
    top: 120
  },
  scrollViewContent: {
    paddingBottom: 200,
  },
  label: {
    marginTop: 10,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    left: 25,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginLeft: 20,
    fontSize: 18,
    backgroundColor: 'white',
    width: '90%',
  },
  logoutButton: {
    width: '90%',
    marginLeft: 20,
    marginTop: 20,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    zIndex: 1,
  },
  submitButton: {
    width: '90%',
    marginLeft: 20,
    marginTop: 30,
    padding: 10,
    backgroundColor: '#57b9ff',
    borderRadius: 10,
    zIndex: 1,
    alignItems: 'center',
  },
  submittext: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    height: 120,
    width: 120,
    borderRadius: 60,
  },
  changeAvatarButton: {
    marginTop: 55,
    position: 'absolute',
  },
  changeAvatarButtonText: {
    color: '#1E90FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Profile;
