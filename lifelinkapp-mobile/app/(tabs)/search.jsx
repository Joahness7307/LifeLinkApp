import React from 'react'
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native';
import { useState, useContext, useEffect} from 'react'
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { imagess } from '../../constants';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../config';
import { LocationContext } from '../../context/LocationContext';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const Search = () => {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentLocation } = useContext(LocationContext);
  const [isOffline, setIsOffline] = useState(false);

  const staticDepartments = [
    { name: 'National Police', mobileNumbers: ['117'], landlineNumbers: [], address: 'Philippines', emergencyTypes: ['Police'] },
    { name: 'Fire Department', mobileNumbers: ['160'], landlineNumbers: [], address: 'Philippines', emergencyTypes: ['Fire'] },
    // Add more as needed
  ];

  // Debounce search input for better UX
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

 useEffect(() => {
  if (isOffline) {
    AsyncStorage.getItem('cachedDepartments').then(cached => {
      if (cached) {
        // Show all cached departments if no search term, or filter by searchTerm
        const all = JSON.parse(cached);
        if (searchTerm.trim().length > 0) {
          const filtered = all.filter(d =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.address.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setResults(filtered.map(d => ({ ...d, _type: 'department' })));
        } else {
          setResults([staticDepartments, ...all].map(d => ({ ...d, _type: 'department' })));
        }
      }
    });
  }
}, [isOffline, searchTerm]);

  const handleSearch = async () => {
  if (isOffline) return; // Don't search/fetch if offline
  setLoading(true);
  try {
    const token = await SecureStore.getItemAsync('token');
    console.log('Search token:', token);
    console.log('API_BASE_URL:', API_BASE_URL);

    // Get cityId from GPS or user profile
    const cityId = currentLocation?.cityObj?._id || user?.address?.city;

    // Fetch only reports (user's own, backend handles filtering)
    const reportsRes = await fetch(
      `${API_BASE_URL}/api/reports?search=${encodeURIComponent(searchTerm)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Reports status:', reportsRes.status);
    if (!reportsRes.ok) throw new Error('Reports fetch failed');
    const reportsData = await reportsRes.json();

     // Fetch departments in user's city
    let departmentsData = [];
      if (cityId) {
        const departmentsRes = await fetch(
          `${API_BASE_URL}/api/departments/search?q=${encodeURIComponent(searchTerm)}&city=${cityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        departmentsData = await departmentsRes.json();
        console.log('Departments data:', departmentsData);
        // Ensure departmentsData is always an array
        if (!Array.isArray(departmentsData)) {
          departmentsData = [];
        }
      }

   // If any department matches, show only departments; else show only reports
    let filteredResults = [];
    if (departmentsData.length > 0) {
      filteredResults = departmentsData.map(d => ({ ...d, _type: 'department' }));
    } else {
      filteredResults = (reportsData.reports || []).map(r => ({ ...r, _type: 'report' }));
    }
    setResults(filteredResults);
  } catch (e) {
    console.log('Search error:', e);
    alert('Search failed: ' + e.message);
  }
  setLoading(false);
};

useFocusEffect(
  React.useCallback(() => {
    // Reset search input and results when screen is focused
    setSearchTerm('');
    setResults([]);
    setLoading(false);
    // No cleanup needed
  }, [])
);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      keyboardShouldPersistTaps="handled"
    >
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
            You are offline. Showing last saved contacts.
          </Text>
        </View>
      )}

      <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', width: '100%', marginBottom: 16, marginTop: 16}}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            accessibilityLabel="Search-Input"
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Search</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          results.length > 0 ? (
            results.map((item, idx) => {
              if (item._type === 'report') {
                return (
                  <TouchableOpacity
                    key={item._id || idx}
                    style={{ padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, width: 320 }}
                    onPress={() => router.push(`/report-details/${item._id}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontWeight: 'bold' }}>{item.referenceNumber || item.type}</Text>
                    <Text>{item.subtype || item.address || ''}</Text>
                    <Text>{item.status ? `Status: ${item.status}` : ''}</Text>
                  </TouchableOpacity>
                );
              } else if (item._type === 'department') {
                return (
                  <View
                    key={item._id || idx}
                    style={{ padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, width: 320 }}
                  >
                    <Text style={{ fontWeight: 'bold', color: '#C65D00' }}>{item.name}</Text>
                    <Text style={{ color: '#888' }}>{item.address}</Text>
                    {/* Mobile Numbers */}
                    {item.mobileNumbers?.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                        {item.mobileNumbers.map((num, i) => (
                          <TouchableOpacity
                            key={`mobile-${num}-${i}`}
                            onPress={() => Linking.openURL(`tel:${num}`)}
                            style={{ marginRight: 12, marginBottom: 4 }}
                          >
                            <Text style={{ color: '#1976d2', textDecorationLine: 'underline' }}>📱 {num}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    {/* Landline Numbers */}
                    {item.landlineNumbers?.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {item.landlineNumbers.map((num, i) => (
                          <TouchableOpacity
                            key={`landline-${num}-${i}`}
                            onPress={() => Linking.openURL(`tel:${num}`)}
                            style={{ marginRight: 12, marginBottom: 4 }}
                          >
                            <Text style={{ color: '#1976d2', textDecorationLine: 'underline' }}>☎️ {num}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <Text style={{ color: '#C65D00', marginTop: 4 }}>
                      {item.emergencyTypes?.join(', ')}
                    </Text>
                  </View>
                );
              }
              return null;
            })
          ) : (
            <Text style={{ color: '#888', marginTop: 16 }}>No results found.</Text>
          )
        )}
      </View>
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
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  headerRow: {
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
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
    marginBottom: 32,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    fontSize: 16,
    marginRight: 8, // Add spacing between input and button
  },
  searchBtn: {
    backgroundColor: '#C65D00',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default Search