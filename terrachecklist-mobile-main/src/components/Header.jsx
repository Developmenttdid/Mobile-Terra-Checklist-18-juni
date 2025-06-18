import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

const Header = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.text}>Header</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'darkblue',
    height: 70,
  },
  text: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    top: '22%',
    margin: 20,
  }
});

export default Header;