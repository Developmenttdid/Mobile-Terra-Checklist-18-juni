import React from 'react';
import { StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const unsplashPhotos = [
  { source: require('../../assets/Inspection.jpeg') },
  { source: require('../../assets/Team 4.jpeg') },
  { source: require('../../assets/Team 11.jpeg') },
  { source: require('../../assets/Team 15.jpeg') },
];

const width = Dimensions.get('window').width;

const Homepage = ({ navigation }) => (
  <View style={styles.container}>
    <View style={styles.backgroundcont}>
      <Image style={styles.backgroundimage} source={require('../../assets/background.png')} />
    </View>
    <Text style={styles.text}>Simplify. Organize. Achieve.</Text>
    <Image style={styles.terralogo} source={require('../../assets/negative_yoko_white.png')} />
    <Text style={styles.text2}>Our app helps you streamline every phase of your drone operations, from packing to post-flight, ensuring nothing is overlooked.</Text>
    <View style={styles.carouselcont}>
      <Carousel
        loop
        width={width}
        height={width / 1.5}
        autoPlay={true}
        data={unsplashPhotos}
        scrollAnimationDuration={1000}
        onSnapToItem={(index) => {}}
        renderItem={({ item }) => (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Image source={item.source} style={{ width: '100%', height: '100%' }} />
          </View>
        )}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040F2E',
  },
  backgroundcont: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 305,
    width: '100%',
  },
  backgroundimage: {
    position: 'absolute',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  text: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    top: '22%',
  },
  text2: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'regular',
    textAlign: 'center',
    top: '22%',
    padding: 20,
  },
  terralogo: {
    position: 'absolute',
    top: 20,
    left: '24%',
    height: 120,
    width: 200,
  },
  carouselcont: {
    position: 'absolute',
    top: 320,
    left: 0,
    height: 90,
  },
});

export default Homepage;