import React from 'react';
import { StyleSheet, Text, View} from 'react-native';

const Document = ({ navigation }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.text}>Document</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040F2E',
  },
  text: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'left',
    top: '25%',
    left: '3%',
    margin: 20,
  }, 
  header: {
    backgroundColor: 'white',
    height: 80,
  }
});

export default Document;