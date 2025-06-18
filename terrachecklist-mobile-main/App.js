import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionSpecs, CardStyleInterpolators } from '@react-navigation/stack';
import Login from './src/pages/Login';
import Homepage from './src/pages/Homepage';
import Navigation from './src/components/Navigation';
import Profile from './src/pages/User/Profile_details';
import Database from './src/pages/Database';
import Document from './src/pages/Document';
import ProjectList from './src/pages/Projectlist';
import { AuthProvider } from './src/context/AuthContext';
import UAVPage from './src/pages/UAVPage';
import GPSPage from './src/pages/GPSPage';
import PayloadPage from './src/pages/PayloadPage';
import OtherPage from './src/pages/OtherPage';
import PPEPage from './src/pages/PPEPage';
import UAVPage_Db from './src/pages/database/UAVPage_db';
import GPSPage_Db from './src/pages/database/GPSPage_db';
import PayloadPage_Db from './src/pages/database/PayloadPage_db';
import OtherPage_Db from './src/pages/database/OtherPage_db';
import PPEPage_Db from './src/pages/database/PPEPage_db';
import HandoverPage from './src/pages/HandoverPage';
import HandoverPage_Db from './src/pages/database/HandoverPage_db';
import 'react-native-reanimated';
import { ProjectProvider } from './src/pages/ProjectContext'; // Import Context Provider
import { PPEProvider } from './src/pages/PPEContext';
import {SaveProvider} from './src/pages/database/SaveContext';
import {SaveInProvider} from './src/pages/database/SaveInContext';

const Stack = createStackNavigator();
const MainStack = createStackNavigator();

const fadeTransition = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: TransitionSpecs.FadeInFromBottomAndroidSpec,
    close: TransitionSpecs.FadeOutToBottomAndroidSpec,
  },
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
};

function MainNavigator() {
  return (
    <ProjectProvider>
      <SaveProvider>
        <SaveInProvider>
      <PPEProvider>
    <View style={{ flex: 1 }}>
      <MainStack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
        <MainStack.Screen name="Homepage" component={Homepage} />
        <MainStack.Screen name="Profile" component={Profile} />
        <MainStack.Screen name="Database" component={Database} />
        <MainStack.Screen name="Document" component={Document} />
        <MainStack.Screen name="ProjectList" component={ProjectList} />
        <MainStack.Screen name="UAVPage" component={UAVPage} />
        <MainStack.Screen name="GPSPage" component={GPSPage} />
        <MainStack.Screen name="PPEPage" component={PPEPage} />
        <MainStack.Screen name="PayloadPage" component={PayloadPage} />
        <MainStack.Screen name="OtherPage" component={OtherPage} />
        <MainStack.Screen name="UAVPage_db" component={UAVPage_Db} />
        <MainStack.Screen name="GPSPage_db" component={GPSPage_Db} />
        <MainStack.Screen name="PPEPage_db" component={PPEPage_Db} />
        <MainStack.Screen name="PayloadPage_db" component={PayloadPage_Db} />
        <MainStack.Screen name="OtherPage_db" component={OtherPage_Db} />
        <MainStack.Screen name="HandoverPage" component={HandoverPage} />
        <MainStack.Screen name="HandoverPage_db" component={HandoverPage_Db} />
      </MainStack.Navigator>
      <Navigation />
    </View>
    </PPEProvider>
    </SaveInProvider>
    </SaveProvider>
    </ProjectProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Main" component={MainNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

export default App;


