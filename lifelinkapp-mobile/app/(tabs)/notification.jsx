import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React, { useContext } from 'react';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext.jsx';
import { imagess } from '../../constants';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

const Notification = () => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);

   useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header (copied from Home) */}
      <View style={styles.headerRow}>
        <Image source={imagess.appLogo} style={styles.logo} />
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Image
            source={user && user.profilePicture ? { uri: user.profilePicture } : imagess.profile}
            style={styles.profileImg}
          />
        </TouchableOpacity>
      </View>
      {isOffline && (
        <View style={{ backgroundColor: '#ffcc00', padding: 8, marginBottom: 8 }}>
          <Text style={{ color: '#333', textAlign: 'center' }}>
            You are offline. Some features may be unavailable.
          </Text>
        </View>
      )}
      <Text style={styles.title}>Notifications will appear here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 130,
    height: 45,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 32,
    textAlign: 'center',
  },
});

export default Notification;