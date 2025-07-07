import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import * as SecureStore from 'expo-secure-store';
import { Linking, FlatList, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LocationContext } from '../../context/LocationContext';
import { imagess } from '../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { staticDepartments } from '../../constants/emergencyContacts';

const Contacts = () => {
  const router = useRouter();
  const { user, setUser } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const { currentLocation } = useContext(LocationContext);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const refreshUser = async () => {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) setUser(JSON.parse(userData));
    };
    if (isFocused) refreshUser();
  }, [isFocused]);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/api/departments`;
        const cityId = currentLocation?.cityObj?._id || user?.address?.city;
        if (cityId) {
          url += `?city=${cityId}`;
        }
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setDepartments(data);
       // Cache departments for offline use
      await AsyncStorage.setItem('cachedDepartments', JSON.stringify(data));
    } catch (e) {
      setDepartments([]);
  }
  setLoading(false);
  };
    fetchDepartments();
  }, [user, currentLocation]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOffline) {
      AsyncStorage.getItem('cachedDepartments').then(cached => {
        if (cached) {
          setDepartments(JSON.parse(cached));
        } else {
          setDepartments(staticDepartments);
        }
      });
    }
  }, [isOffline]);

  if (!(currentLocation?.cityObj?._id || user?.address?.city)) {
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
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
              <Text style={{ color: '#333', textAlign: 'center' }}>You are offline. Showing last saved contacts.</Text>
            </View>
          )}
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={{ color: '#888', marginTop: 20, textAlign: 'center' }}>
          Please set your address in your profile or allow location access to see local emergency contacts.
        </Text>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Text style={{ color: '#C65D00', marginTop: 16 }}>Set Address</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.headerRow}>
        <Image source={imagess.appLogo} style={styles.logo} />
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Image
            source={user && user.profilePicture ? { uri: user.profilePicture } : imagess.profile}
            style={styles.profileImg}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={{
        color: 'red',
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Warning: Emergency numbers are for real emergencies only. False or prank calls are punishable by law.
      </Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={departments}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.departmentCard}>
              <Text style={styles.deptName}>{item.name}</Text>
              <Text style={styles.deptType}>{item.emergencyTypes.join(', ')}</Text>
              <Text style={styles.deptAddress}>{item.address}</Text>
              {item.mobileNumbers?.map((num, idx) => (
                <TouchableOpacity key={idx} onPress={() => Linking.openURL(`tel:${num}`)}>
                  <Text style={styles.phoneNumber}>📱 {num}</Text>
                </TouchableOpacity>
              ))}
              {item.landlineNumbers?.map((num, idx) => (
                <TouchableOpacity key={idx} onPress={() => Linking.openURL(`tel:${num}`)}>
                  <Text style={styles.phoneNumber}>☎️ {num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          scrollEnabled={false} // Let ScrollView handle scrolling
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center' }}>No departments found.</Text>}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  scrollViewContent: {
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
    fontFamily: 'Poppins-Bold',
    marginTop: 16,
    marginBottom: 22,
    color: '#ED213A',
  },
  departmentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  deptName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  deptType: {
    color: '#C65D00',
    marginBottom: 2,
  },
  deptAddress: {
    color: '#888',
    marginBottom: 6,
  },
  phoneNumber: {
    color: '#1976d2',
    fontSize: 15,
    marginBottom: 2,
  },
});

export default Contacts;