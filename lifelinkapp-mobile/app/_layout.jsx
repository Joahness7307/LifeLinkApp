import React from 'react'
import { AuthProvider } from '../context/AuthContext'
import { Stack, SplashScreen } from 'expo-router'
import { useFonts } from 'expo-font'
import { useEffect } from 'react'
import { View, StatusBar, StyleSheet } from 'react-native'
import Toast, { BaseToast } from 'react-native-toast-message'
import { socketRef } from '../utils/socketRef';
import { io } from 'socket.io-client';
import { LocationProvider } from '../context/LocationContext'
import * as Linking from 'expo-linking';

const SOCKET_URL = 'https://lifelink-backend-izjs.onrender.com'; // your backend
const linking = {
  prefixes: ['lifelinkapp-mobile://'],
  config: {
    screens: {
      '(auth)/reset-password': 'reset-password/:token',
      '(auth)/forgot-password': 'forgot-password',
      // ...other screens
    },
  },
};

export default function MainLayout({ children }) {
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }
    // Optionally, handle cleanup on logout
    return () => {
      // Do not disconnect here unless logging out
    };
  }, []);

  const [fontsLoaded, error] = useFonts({
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  // Custom Toast with larger font
  const CustomBaseToast = (props) => {

    return (
        <BaseToast
          {...props}
          style={{ borderLeftColor: '#C65D00', ...props.style }}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          text1Style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#222',
          }}
          text2Style={{
            fontSize: 15,
            color: '#444',
          }}
        />
    );
  };

  return (
    <AuthProvider>
      <LocationProvider>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="orange" />
          <Stack
            screenOptions={{
              headerShown: false
            }}
            linking={linking}
          />
          <Toast
            position="top"
            topOffset={35}
            config={{
              success: (props) => <CustomBaseToast {...props} />,
              info: (props) => <CustomBaseToast {...props} />,
              error: (props) => <CustomBaseToast {...props} />,
            }}
          />
        </View>
      </LocationProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB', // Tailwind's bg-gray-50
    height: '100%',
    flex: 1,
  },
});
