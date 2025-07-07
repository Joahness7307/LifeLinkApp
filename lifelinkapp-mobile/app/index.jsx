import { Text, View, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { imagess } from '../constants';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

export default function App() {
  const router = useRouter();

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <Image
          source={imagess.worldMap}
          resizeMode="cover"
          style={styles.worldMap}
        />
        <ScrollView contentContainerStyle={{ height: '100%' }}>
          <View style={styles.centered}>
            <Image
              source={imagess.appLogo}
              resizeMode="contain"
              style={styles.logo}
              alt="LifeLink Logo"
            />
            <Text style={styles.subtitle}>Your safety is our priority</Text>
            <View style={styles.buttonContainer}>
              <CustomButton
                title="Log In to Get Started"
                handlePress={() => router.push('/sign-in')}
                containerStyles=""
              />
              <CustomButton
                title="Emergency Contacts"
                handlePress={() => router.push('/emergency-contacts')}
                containerStyles={{ marginTop: 16, backgroundColor: '#C65D00' }}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  worldMap: {
    width: '100%',
    height: 280,
    marginTop: -20,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 224,
    height: 80,
  },
  subtitle: {
    fontSize: 18,
    color: '#525252',
    marginTop: 48,
    marginBottom: 32,
    fontFamily: 'Poppins-Medium',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 72,
  },
});