import React from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation, useNavigationState } from '@react-navigation/native';

const Navigation = () => {
  const navigation = useNavigation();
  const state = useNavigationState(state => state);
  const currentRoute = state.routes[state.index].state
    ? state.routes[state.index].state.routes[state.routes[state.index].state.index].name
    : state.routes[state.index].name;

  return (
    <View style={styles.navigationcont}>
      <Pressable
        style={styles.plusbutton}
        onPress={() => navigation.navigate('Main', { screen: 'ProjectList' })}
      >
        <Image 
          source={{ uri: 'https://img.icons8.com/ios-filled/50/checklist--v1.png' }}
          style={styles.checklistIcon}
        />
      </Pressable>

      <NavItem icon="home" screen="Homepage" navigation={navigation} currentRoute={currentRoute} style={styles.homeicon} />
      <NavItem icon="database" screen="Database" navigation={navigation} currentRoute={currentRoute} style={styles.databaseicon} />
      
      <Pressable 
        style={styles.templateicon} 
        onPress={() => navigation.navigate('Main', { screen: 'Document' })}
      >
        
        <Image 
          source={{ uri: 'https://img.icons8.com/windows/32/document--v1.png' }}
          style={[styles.documentIcon, { tintColor: currentRoute === 'Document' ? 'blue' : 'black' }]}
        />
      </Pressable>
      
      <NavItem icon="user" screen="Profile" navigation={navigation} currentRoute={currentRoute} style={styles.usericon} />
    </View>
  );
};

const NavItem = ({ icon, screen, navigation, currentRoute, style }) => {
  const isActive = currentRoute === screen;

  return (
    <Pressable style={style} onPress={() => navigation.navigate('Main', { screen })}>
      <Icon name={icon} size={30} color={isActive ? 'blue' : 'black'} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  navigationcont: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 70,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  plusbutton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#040F2E',
    height: 60,
    width: 60,
    top: 5,
    left: '42%',
    borderRadius: 60,
  },
  homeicon: {
    position: 'absolute',
    top: 18,
    left: '8%',
  },
  databaseicon: {
    position: 'absolute',
    top: 20,
    left: '26%',
  },
  templateicon: {
    position: 'absolute',
    top: 20,
    left: '66%',
  },
  usericon: {
    position: 'absolute',
    top: 20,
    left: '85%',
  },
  checklistIcon: {
    width: 30,
    height: 30,
    tintColor: 'white'
  },
  documentIcon: {
    width: 30,
    height: 30,
  },
});

export default Navigation;