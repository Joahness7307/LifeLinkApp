import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, Modal, ScrollView, StyleSheet, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { AuthContext } from '../../context/AuthContext.jsx';
import { socketRef } from '../../utils/socketRef';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { imagess } from '../../constants';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import io from 'socket.io-client';
import { API_BASE_URL } from '../../config';
import { useIsFocused } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { playNotificationSound } from '../../utils/playNotificationSound';
import { LocationContext } from '../../context/LocationContext.jsx';
import NetInfo from '@react-native-community/netinfo';

const [isOffline, setIsOffline] = useState(false)
const SOCKET_URL = 'https://lifelink-backend-izjs.onrender.com';

const allowedImageExt = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedVideoExt = ['.mp4', '.mov', '.webm'];

const Home = () => {
  const { user, setUser } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const router = useRouter();
  const socketRef = useRef(null);
  const showConfirmOnLocation = useRef(false);
  const showConfirmOnLocationRef = useRef(false);
  const { setCurrentLocation } = useContext(LocationContext);

  // State declarations
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [typeList, setTypeList] = useState([]);
  const [selectedType, setSelectedType] = useState(null);

  const [subtypeModalVisible, setSubtypeModalVisible] = useState(false);
  const [subtypeList, setSubtypeList] = useState([]);
  const [selectedSubtype, setSelectedSubtype] = useState(null);

  const [locationChoiceModal, setLocationChoiceModal] = useState(false);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [reportLocation, setReportLocation] = useState(null);
  const [displayAddress, setDisplayAddress] = useState('');

  const [manualAddressModal, setManualAddressModal] = useState(false);

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  const [mapPickerModal, setMapPickerModal] = useState(false);
  const [manualPinLocation, setManualPinLocation] = useState(null);

  const [regionSearch, setRegionSearch] = useState('');
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);

  const [provinceSearch, setProvinceSearch] = useState('');
  const [provincePickerVisible, setProvincePickerVisible] = useState(false);

  const [citySearch, setCitySearch] = useState('');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  const [barangaySearch, setBarangaySearch] = useState('');
  const [barangayPickerVisible, setBarangayPickerVisible] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const MAX_FILES = 3;
  const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
  const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

  const ALLOWED_REGION_CODES = ['070000000'];
  const ALLOWED_PROVINCE_CODES = ['072200000'];
  const ALLOWED_CITY_CODES = ['072251000', '072234000'];
  const ALLOWED_MUNICIPALITY_CODES = ['072208000'];

  const [recentReports, setRecentReports] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [addressDataLoaded, setAddressDataLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

   useEffect(() => {
    const fetchUser = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        await SecureStore.setItemAsync('user', JSON.stringify(data));
      }
    };
    fetchUser();
  }, [isFocused]);

   useEffect(() => {
    const setupSocket = async () => {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('connect', () => {
        console.log('User joined socket room:', userId);
        socketRef.current.emit('join_user', userId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('User disconnected from socket', userId);
      });

      socketRef.current.on('report_status_updated', (data) => {
        console.log('Report status updated:', data);
        fetchRecentReports();
        let statusMsg = '';
        if (data.isFake) {
          statusMsg = `🚩 Your report was marked as FAKE${data.fakeReason ? ': ' + data.fakeReason : ''}`;
        } else if (data.status === 'in_progress') {
          statusMsg = 'Your report is now IN PROGRESS.';
        } else if (data.status === 'resolved') {
          statusMsg = 'Your report has been RESOLVED.';
        } else {
          statusMsg = `Your report status: ${data.status}`;
        }
        playNotificationSound();
        Vibration.vibrate(500); // Vibrate for 500ms
        Toast.show({
          type: data.isFake ? 'error' : 'info',
          text1: 'Report Status Updated',
          text2: statusMsg,
          visibilityTime: 6000,
        });
      });
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('report_status_updated');
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch user's current location with callback
  const fetchCurrentLocation = async (onSuccess) => {
    setLocationLoading(true);
    let timeout;
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        Alert.alert(
          'Location Required',
          'Location permission is required to submit a report.',
          [
            {
              text: 'Retry',
              onPress: () => fetchCurrentLocation(onSuccess),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        setLocation(null);
        return;
      }
      // Timeout after 8 seconds
      timeout = setTimeout(() => {
        setLocationLoading(false);
        Alert.alert(
          'Timeout',
          'Fetching your location is taking too long. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => fetchCurrentLocation(onSuccess),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }, 8000);

      let loc = await Location.getCurrentPositionAsync({});
      clearTimeout(timeout);
      setLocation(loc.coords);
      setLocationLoading(false);
      handleUseCurrentLocation(loc.coords);
      if (onSuccess) onSuccess(loc.coords);
    } catch (e) {
      clearTimeout(timeout);
      setLocationLoading(false);
      Alert.alert(
        'Location Error',
        'Could not fetch location. Please enable location services.',
        [
          {
            text: 'Retry',
            onPress: () => fetchCurrentLocation(onSuccess),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      setLocation(null);
    }
    setLocationLoading(false);
  };

  useEffect(() => {
    if (addressDataLoaded) {
      fetchCurrentLocation();
    }
  }, [addressDataLoaded]);

  // Fetch regions, provinces, cities, and barangays
  const fetchRegions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/address/regions`);
      const data = await res.json();
      setRegions(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch regions');
    }
  };

  const fetchAllProvinces = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/address/provinces`);
      const data = await res.json();
      setProvinces(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch all provinces');
    }
  };

  const fetchAllCities = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/address/cities`);
      const data = await res.json();
      setCities(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch all cities');
    }
  };

  const fetchBarangays = async (cityId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/address/barangays/${cityId}`);
      const data = await res.json();
      setBarangays(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch barangays');
    }
  };

 useEffect(() => {
  const loadAllAddressData = async () => {
    await fetchRegions();
    await fetchAllProvinces();
    await fetchAllCities();
    setAddressDataLoaded(true);
  };
  loadAllAddressData();
}, []);

  useEffect(() => {
    if (selectedRegion) fetchAllProvinces(selectedRegion);
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedProvince) fetchAllCities(selectedProvince);
  }, [selectedProvince]);

  useEffect(() => {
  const fetchAddress = async () => {
    if (reportLocation && confirmModalVisible) {
      setDisplayAddress('Fetching address...');
      try {
        const [result] = await Location.reverseGeocodeAsync({
          latitude: reportLocation.latitude,
          longitude: reportLocation.longitude,
        });
        if (result) {
          const addressString = [
            result.street || result.name,
            result.barangay,
            result.city || result.municipality,
            result.subregion,
            result.region,
            result.country || 'Philippines'
          ].filter(Boolean).join(', ');
          setDisplayAddress(addressString);
        } else {
          setDisplayAddress('Address unavailable');
        }
      } catch {
        setDisplayAddress('Address unavailable');
      }
    }
  };
  fetchAddress();
}, [reportLocation, confirmModalVisible]);

  // Fetch recent reports on mount and after submitting a report
  const fetchRecentReports = async () => {
    setRecentLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/reports/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRecentReports(data);
      else setRecentReports([]);
    } catch (e) {
      setRecentReports([]);
    }
    setRecentLoading(false);
  };

  useEffect(() => {
    fetchRecentReports();
  }, []);


  const normalize = str => str?.toLowerCase().replace(/^(city of |municipality of )/i, '').replace(/[^a-z0-9]/gi, '');

  // Helper to map geocode result to city/province/region IDs
  const mapGeocodeToAddressIds = async (geocodeResult, coords = null) => {
    const cityName = geocodeResult.city || geocodeResult.municipality;
    const provinceName = geocodeResult.subregion;
    const regionName = geocodeResult.region;
    let barangayName = geocodeResult.barangay;

    let cityObj = cities.find(c => c.name.toLowerCase() === cityName?.toLowerCase());
    if (!cityObj) {
      cityObj = cities.find(c =>
        normalize(c.name) === normalize(cityName) ||
        normalize(c.name).includes(normalize(cityName)) ||
        normalize(cityName).includes(normalize(c.name))
      );
    }

    if (cityObj && (!barangays.length || barangays[0]?.city !== cityObj._id)) {
      await fetchBarangays(cityObj._id);
    }

    let provinceObj = provinces.find(p => p.name.toLowerCase() === provinceName?.toLowerCase());
    if (!provinceObj) {
      provinceObj = provinces.find(p =>
        normalize(p.name) === normalize(provinceName) ||
        normalize(p.name).includes(normalize(provinceName)) ||
        normalize(provinceName).includes(normalize(p.name))
      );
    }

    let regionObj = regions.find(r => r.name.toLowerCase() === regionName?.toLowerCase());
    if (!regionObj) {
      regionObj = regions.find(r =>
        normalize(r.name) === normalize(regionName) ||
        normalize(r.name).includes(normalize(regionName)) ||
        normalize(regionName).includes(normalize(r.name))
      );
    }

    let barangayObj = barangays.find(b => normalize(b.name) === normalize(barangayName));
    if (!barangayObj && barangayName) {
      barangayObj = barangays.find(b =>
        normalize(b.name).includes(normalize(barangayName)) ||
        normalize(barangayName).includes(normalize(b.name))
      );
    }

    if (!barangayObj && coords && barangays.length > 0) {
      let minDist = Infinity;
      let nearestBarangay = null;
      for (const b of barangays) {
        if (b.latitude && b.longitude) {
          const dist = Math.sqrt(
            Math.pow(b.latitude - coords.latitude, 2) +
            Math.pow(b.longitude - coords.longitude, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearestBarangay = b;
          }
        }
      }
      if (nearestBarangay && minDist < 0.05) {
        barangayObj = nearestBarangay;
        barangayName = barangayObj.name;
      }
    }

    if (!barangayObj && cityObj) {
      const cityBarangays = barangays.filter(b => b.city === cityObj._id);
      if (cityBarangays.length === 1) {
        barangayObj = cityBarangays[0];
        barangayName = barangayObj.name;
      }
    }
    console.log('Geocoded city:', cityName, 'Matched cityObj:', cityObj);
    console.log('Available cities:', cities.map(c => c.name));

    return {
      cityObj: cityObj || null,
      provinceObj: provinceObj || null,
      regionObj: regionObj || null,
      barangayObj: barangayObj || null,
      barangayName: barangayName || null
    };
  };

  const getHumanReadableAddress = async (coords) => {
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (!results || results.length === 0) return 'Address unavailable';
      const result = results[0];
      return [
        result.street || result.name,
        result.barangay,
        result.city || result.municipality,
        result.subregion,
        result.region,
        result.country || 'Philippines'
      ].filter(Boolean).join(', ');
    } catch {
      return 'Address unavailable';
    }
  };

  // When using current location:
  const handleUseCurrentLocation = async (coords = null) => {
  const loc = coords || location;
  if (!loc) return;
  setReportLocation({ latitude: loc.latitude, longitude: loc.longitude });
  setDisplayAddress('Fetching address...');

  // 1. Try to get human-readable address from geocoding
  let addressString = await getHumanReadableAddress(loc);

  if (!regions.length || !provinces.length || !cities.length) {
    Alert.alert('Loading', 'Please wait while address data is loading...');
    return;
  }

  // 2. Try to get a more official address from your mapping
  try {
    let [result] = await Location.reverseGeocodeAsync({
      latitude: loc.latitude,
      longitude: loc.longitude,
    });
    if (result) {
      const { cityObj, provinceObj, regionObj, barangayObj, barangayName } = await mapGeocodeToAddressIds(result, { latitude: loc.latitude, longitude: loc.longitude });

      if (!cityObj) {
        Alert.alert(
          'Location Error',
          'Could not match your location to a city. Please try again or check your address data.'
        );
        return;
      }

      // Build a display address string from mapped objects
      let addressParts = [];
      if (barangayObj?.name || barangayName) addressParts.push(barangayObj?.name || barangayName);
      if (cityObj?.name) addressParts.push(cityObj.name);
      if (provinceObj?.name) addressParts.push(provinceObj.name);
      if (regionObj?.name) addressParts.push(regionObj.name);

      if (addressParts.length > 0) {
        setDisplayAddress(addressParts.join(', '));
      }

      setCurrentLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        cityObj,
        provinceObj,
        regionObj,
        barangayObj,
        barangayName
      });

      // PATCH user address in backend and SecureStore
      if (user && cityObj && provinceObj && regionObj) {
        const token = await SecureStore.getItemAsync('token');
        const updatedAddress = {
          city: cityObj._id,
          province: provinceObj._id,
          region: regionObj._id,
          cityCode: cityObj.code,
          barangay: barangayObj?._id || '',
          barangayCode: barangayObj?.code || ''
        };
        await fetch(`https://lifelink-backend-izjs.onrender.com/api/user/${user._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address: updatedAddress }),
        });
        // Update local user context and SecureStore
        const updatedUser = { ...user, address: updatedAddress };
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      }

      setSelectedCity(cityObj?._id || null);
      setSelectedProvince(provinceObj?._id || null);
      setSelectedRegion(regionObj?._id || null);
      setSelectedBarangay(barangayObj?.name || barangayName || null);

      setReportLocation({ latitude: loc.latitude, longitude: loc.longitude });
      setSelectedFiles([]);

      // Only show modal if user explicitly requested to report
      if (showConfirmOnLocationRef.current) {
        setConfirmModalVisible(true);
        showConfirmOnLocationRef.current = false;
      }
    } else {
      setDisplayAddress(addressString || 'Address unavailable');
    }
    setLocationChoiceModal(false);
    setManualAddressModal(false);
    setMapPickerModal(false);
  } catch (e) {
    console.error('Error fetching address:', e);
    setDisplayAddress(addressString || 'Address unavailable');
    setLocationChoiceModal(false);
    setManualAddressModal(false);
    setMapPickerModal(false);
  }
};

  if (showConfirmOnLocationRef.current) {
    setConfirmModalVisible(true);
    showConfirmOnLocationRef.current = false;
  }

    // When user taps "Use Current Location" for a report:
    const onUserWantsToReport = () => {
      showConfirmOnLocationRef.current = true;
      fetchCurrentLocation();
    };

    const onManualLocationConfirm = (coords) => {
      showConfirmOnLocationRef.current = true;
      handleUseCurrentLocation(coords);
    };

  // useEffect(() => {
  //   if (location) {
  //     handleUseCurrentLocation(location);
  //   }
  // }, [location]);

  // Fetch emergency types from the server
  const fetchTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/emergencies/types`);
      const data = await res.json();
      setTypeList(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch emergency types');
    }
  };

  // Fetch subtypes based on selected type
  const fetchSubtypes = async (type) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/emergencies/subtypes/${type}`);
      const data = await res.json();
      setSubtypeList(data);
      setSubtypeModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch subtypes');
    }
  };

  const pickFiles = async () => {
    try {
      if (selectedFiles.length >= MAX_FILES) {
        Alert.alert('Limit reached', `You can only select up to ${MAX_FILES} files.`);
        return;
      }
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      let files = result.assets ? result.assets : [result];
      if (!files || !Array.isArray(files)) files = [];

      const remaining = MAX_FILES - selectedFiles.length;
      if (files.length > remaining) {
        Alert.alert(`Limit reached`, `You can only select up to ${MAX_FILES} files in total.`);
        files = files.slice(0, remaining);
      }

      for (let file of files) {
        const mimeType = file.mimeType || file.type || '';
        const isImage = mimeType.startsWith('image');
        const isVideo = mimeType.startsWith('video');
        const fileName = file.name || file.fileName || '';
        const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

        if (
          (!isImage && !isVideo) ||
          (isImage && !allowedImageExt.includes(fileExt)) ||
          (isVideo && !allowedVideoExt.includes(fileExt))
        ) {
          Alert.alert(
            'Invalid file',
            'Only JPEG, JPG, PNG, WEBP images and MP4, MOV, WEBM videos are allowed.'
          );
          return;
        }
        if (isImage && file.size > MAX_IMAGE_SIZE) {
          Alert.alert('Image too large', 'Each image must be less than 3MB.');
          return;
        }
        if (isVideo && file.size > MAX_VIDEO_SIZE) {
          Alert.alert('Video too large', 'Each video must be less than 15MB.');
          return;
        }
      }

      setSelectedFiles([...selectedFiles, ...files]);
    } catch (e) {
      Alert.alert('Error', 'Could not pick files.');
      console.error(e);
    }
  };

  const removeFile = idx => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));

  const submitReport = async () => {
    if (isOffline) {
      alert('You are offline. Please connect to the internet to submit a report.');
      return;
    }

    try {
      const userToken = await SecureStore.getItemAsync('token');
      const regionObj = regions.find(r => r._id === selectedRegion);
      const provinceObj = provinces.find(p => p._id === selectedProvince);
      const cityObj = cities.find(c => c._id === selectedCity);
      const barangayObj = barangays.find(b => b.name === selectedBarangay);

      const address = {
        region: regionObj?._id,
        province: provinceObj?._id,
        city: cityObj?._id,
        cityCode: cityObj?.code || '',
        barangay: barangayObj?.name || selectedBarangay || '',
        barangayCode: barangayObj?.code || '',
        display: displayAddress,
      };

      const locationObj = reportLocation
        ? { latitude: reportLocation.latitude, longitude: reportLocation.longitude }
        : null;

      const formData = new FormData();
      formData.append('type', selectedType);
      formData.append('subtype', selectedSubtype);
      formData.append('address', JSON.stringify(address));
      formData.append('location', JSON.stringify(locationObj));
      formData.append('clientSubmittedAt', new Date().toISOString());
      selectedFiles.forEach((file, idx) => {
        let type = file.mimeType || file.type || '';
        if (!type || type === 'application/octet-stream') {
          const ext = (file.name || file.fileName || '').split('.').pop().toLowerCase();
          if (['jpg', 'jpeg'].includes(ext)) type = 'image/jpeg';
          else if (ext === 'png') type = 'image/png';
          else if (ext === 'webp') type = 'image/webp';
          else if (ext === 'mp4') type = 'video/mp4';
          else if (ext === 'mov') type = 'video/quicktime';
          else if (ext === 'webm') type = 'video/webm';
          else type = 'application/octet-stream';
        }
        formData.append('files', {
          uri: file.uri,
          name: file.fileName || file.name || `file_${idx}`,
          type,
        });
      });

      const response = await fetch(`${API_BASE_URL}/api/reports/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      let data;
        try {
          data = await response.json();
        } catch (e) {
          console.log('Failed to parse JSON:', e);
          data = {};
        }

      // Add these logs:
    console.log('API response status:', response.status);
    console.log('API response data:', data);

    if (response.status === 429) {
      Alert.alert('Rate Limit', data.error || 'You have reached the report limit. Please try again later.');
    } else if (response.ok) {
      Alert.alert('Report sent!', 'Your emergency report has been submitted.');
      setSelectedFiles([]);
      fetchCurrentLocation();
      clearDropdowns();
      fetchRecentReports();
    } else {
      Alert.alert('Error', data.message || data.error || 'Failed to send report.');
    }
  } catch (error) {
    Alert.alert('Error', 'Could not send report.');
    console.error(error);
  }
};

  const clearDropdowns = () => {
    setSelectedRegion(null);
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedBarangay(null);
    setRegionSearch('');
    setProvinceSearch('');
    setCitySearch('');
    setBarangaySearch('');
    setProvinces([]);
    setCities([]);
    setBarangays([]);

    // Re-fetch address data so they're ready for next report
    fetchRegions();
    fetchAllProvinces();
    fetchAllCities();
  };

  if (user === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C65D00" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
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

      {user && user.isBlocked && (
        <View style={{ backgroundColor: '#fee', padding: 12, borderRadius: 8, margin: 12 }}>
          <Text style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
            Your account is blocked from submitting a reports due to repeated fake reports.
            Please contact support if you believe this is a mistake.
          </Text>
        </View>
      )}

      {/* Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyBtn}
        onPress={() => {
          if (user && user.isBlocked) {
            Toast.show({ type: 'error', text1: 'Blocked', text2: 'You cannot submit new reports.' });
            return;
          }
          fetchTypes();
          setTypeModalVisible(true);
        }}
        disabled={user && user.isBlocked}
      >
        <Text style={styles.emergencyBtnText}>SEND EMERGENCY REPORT</Text>
      </TouchableOpacity>

      {/* Emergency Type Modal */}
       <Modal visible={typeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Emergency Type</Text>
            {typeList.map(type => (
              <TouchableOpacity
                key={type}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedType(type);
                  setTypeModalVisible(false);
                  fetchSubtypes(type);
                }}
              >
                <Text style={styles.modalItemText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => {
              setTypeModalVisible(false)
              fetchCurrentLocation();
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Emergency Subtype Modal */}
     <Modal visible={subtypeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                onPress={() => {
                  setSubtypeModalVisible(false);
                  setTypeModalVisible(true);
                }}
                style={styles.modalBackBtn}
              >
                <Ionicons name="arrow-back" size={24} color="#C65D00" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Subtype</Text>
            </View>
            {subtypeList.map(subtype => (
              <TouchableOpacity
                key={subtype}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSubtype(subtype);
                  setSubtypeModalVisible(false);
                  setLocationChoiceModal(true);
                }}
              >
                <Text style={styles.modalItemText}>{subtype}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => {
              setSubtypeModalVisible(false)
              fetchCurrentLocation();  
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Choice Modal */}
      <Modal visible={locationChoiceModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setLocationChoiceModal(false);
                  setSubtypeModalVisible(true);
                }}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="arrow-back" size={24} color="#C65D00" />
              </TouchableOpacity>
              <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Select the emergency location</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#C65D00', padding: 10, borderRadius: 8, marginBottom: 10 }}
              onPress={ () => {
                setLocationChoiceModal(false);
                setLocationLoading(true);
                setSelectedFiles([]);
                showConfirmOnLocationRef.current = true;
                fetchCurrentLocation((coords) => handleUseCurrentLocation(coords));
              }}
            >
              <Text style={{ fontSize: 15, color: '#fff', textAlign: 'center' }}>Use my current location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#C65D00', padding: 10, borderRadius: 8 }}
              onPress={() => {
                setLocationChoiceModal(false);
                setManualAddressModal(true);
                setSelectedRegion(null);
                setSelectedProvince(null);
                setSelectedCity(null);
                setSelectedBarangay(null);
                fetchRegions();
              }}
            >
              <Text style={{ fontSize: 15, color: '#fff', textAlign: 'center' }}>Enter emergency location</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLocationChoiceModal(false)}>
              <Text style={{ fontSize: 15, color: 'red', marginTop: 20, textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Address Modal */}
      <Modal visible={manualAddressModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setManualAddressModal(false);
                  setLocationChoiceModal(true);
                }}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="arrow-back" size={24} color="#C65D00" />
              </TouchableOpacity>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Enter Emergency Location</Text>
            </View>
            {/* Region Dropdown */}
            <Text>Region</Text>
            <TouchableOpacity
              style={{
                borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 8,
                backgroundColor: '#fff'
              }}
              onPress={() => setRegionPickerVisible(true)}
            >
              <Text>
                {selectedRegion
                  ? regions.find(r => r._id === selectedRegion)?.name
                  : 'Select Region'}
              </Text>
            </TouchableOpacity>

            <Modal visible={regionPickerVisible} transparent animationType="slide">
              <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Select Region</Text>
                  <TextInput
                    placeholder="Search region..."
                    value={regionSearch}
                    onChangeText={setRegionSearch}
                    style={{
                      borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 15
                    }}
                  />
                  <ScrollView style={{ maxHeight: 300 }}>
                    {regions
                       .filter(region => ALLOWED_REGION_CODES.includes(region.code))
                        .map(region => (
                          <TouchableOpacity
                            key={region._id}
                            style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
                            onPress={() => {
                            setSelectedRegion(region._id);
                            setSelectedProvince(null);
                            setSelectedCity(null);
                            setSelectedBarangay(null);
                            setProvinces([]);
                            setCities([]);
                            setBarangays([]);
                            setRegionPickerVisible(false);
                            setRegionSearch('');
                            fetchAllProvinces(region._id);
                          }}
                        >
                          <Text>{region.name}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                  <TouchableOpacity onPress={() => setRegionPickerVisible(false)}>
                    <Text style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Province Dropdown */}
           <Text>Province</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 8,
              backgroundColor: '#fff'
            }}
            onPress={() => setProvincePickerVisible(true)}
            disabled={!selectedRegion}
          >
            <Text>
              {selectedProvince
                ? provinces.find(p => p._id === selectedProvince)?.name
                : 'Select Province'}
            </Text>
          </TouchableOpacity>

          <Modal visible={provincePickerVisible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Select Province</Text>
                <TextInput
                  placeholder="Search province..."
                  value={provinceSearch}
                  onChangeText={setProvinceSearch}
                  style={{
                    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 15
                  }}
                />
                <ScrollView style={{ maxHeight: 300 }}>
                  {provinces
                    .filter(province => ALLOWED_PROVINCE_CODES.includes(province.code))
                    .map(province => (
                      <TouchableOpacity
                        key={province._id}
                        style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
                        onPress={() => {
                          setSelectedProvince(province._id);
                          setSelectedCity(null);
                          setSelectedBarangay(null);
                          setCities([]);
                          setBarangays([]);
                          setProvincePickerVisible(false);
                          setProvinceSearch('');
                          fetchAllCities(province._id);
                        }}
                      >
                        <Text>{province.name}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity onPress={() => setProvincePickerVisible(false)}>
                  <Text style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

            {/* City Dropdown */}
           <Text>City</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 8,
              backgroundColor: '#fff'
            }}
            onPress={() => setCityPickerVisible(true)}
            disabled={!selectedProvince}
          >
            <Text>
              {selectedCity
                ? cities.find(c => c._id === selectedCity)?.name
                : 'Select City'}
            </Text>
          </TouchableOpacity>

          <Modal visible={cityPickerVisible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Select City</Text>
                <TextInput
                  placeholder="Search city..."
                  value={citySearch}
                  onChangeText={setCitySearch}
                  style={{
                    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 15
                  }}
                />
                 <ScrollView style={{ maxHeight: 300 }}>
                  {cities
                    .filter(city =>
                      (ALLOWED_CITY_CODES.includes(city.code) ||
                        ALLOWED_MUNICIPALITY_CODES.includes(city.code)) &&
                      (!citySearch ||
                        city.name.toLowerCase().includes(citySearch.toLowerCase()))
                    )
                    .map(city => (
                      <TouchableOpacity
                        key={city._id}
                        style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
                        onPress={() => {
                          setSelectedCity(city._id);
                          setSelectedBarangay(null);
                          setBarangays([]);
                          setCityPickerVisible(false);
                          setCitySearch('');
                          fetchBarangays(city._id);
                        }}
                      >
                        <Text>{city.name}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity onPress={() => setCityPickerVisible(false)}>
                  <Text style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

            {/* Barangay Dropdown */}
            <Text>Barangay</Text>
            <TouchableOpacity
              style={{
                borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 8,
                backgroundColor: '#fff'
              }}
              onPress={() => setBarangayPickerVisible(true)}
              disabled={!selectedCity}
            >
              <Text>
                {selectedBarangay
                  ? barangays.find(b => b.name === selectedBarangay)?.name
                  : 'Select Barangay'}
              </Text>
            </TouchableOpacity>

            <Modal visible={barangayPickerVisible} transparent animationType="slide">
              <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Select Barangay</Text>
                  <TextInput
                    placeholder="Search barangay..."
                    value={barangaySearch}
                    onChangeText={setBarangaySearch}
                    style={{
                      borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 10
                    }}
                  />
                  <ScrollView style={{ maxHeight: 300 }}>
                    {barangays
                      .filter(barangay =>
                        barangay.name.toLowerCase().includes(barangaySearch.toLowerCase())
                      )
                      .map(barangay => (
                        <TouchableOpacity
                          key={barangay._id}
                          style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
                          onPress={() => {
                            setSelectedBarangay(barangay.name);
                            setBarangayPickerVisible(false);
                            setBarangaySearch('');
                          }}
                        >
                          <Text>{barangay.name}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                  <TouchableOpacity onPress={() => setBarangayPickerVisible(false)}>
                    <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#C65D00', padding: 10, borderRadius: 8, flex: 1, marginRight: 8 }}
                disabled={!selectedRegion || !selectedProvince || !selectedCity || !selectedBarangay}
                onPress={async () => {
                   // Try to find the most specific location to center the map
                  let centerLat, centerLng;

                  // 1. Barangay
                  const barangayObj = barangays.find(b => b.name === selectedBarangay);
                  if (barangayObj?.latitude && barangayObj?.longitude) {
                    centerLat = barangayObj.latitude;
                    centerLng = barangayObj.longitude;
                  }

                  // 2. City/Municipality
                  if ((!centerLat || !centerLng) && selectedCity) {
                    const cityObj = cities.find(c => c._id === selectedCity);
                    if (cityObj?.latitude && cityObj?.longitude) {
                      centerLat = cityObj.latitude;
                      centerLng = cityObj.longitude;
                    }
                  }

                  // 3. Province
                  if ((!centerLat || !centerLng) && selectedProvince) {
                    const provinceObj = provinces.find(p => p._id === selectedProvince);
                    if (provinceObj?.latitude && provinceObj?.longitude) {
                      centerLat = provinceObj.latitude;
                      centerLng = provinceObj.longitude;
                    }
                  }

                  // 4. Region
                  if ((!centerLat || !centerLng) && selectedRegion) {
                    const regionObj = regions.find(r => r._id === selectedRegion);
                    if (regionObj?.latitude && regionObj?.longitude) {
                      centerLat = regionObj.latitude;
                      centerLng = regionObj.longitude;
                    }
                  }

                  // 5. Fallback: Cebu City
                  if (!centerLat || !centerLng) {
                    centerLat = 10.3157;
                    centerLng = 123.8854;
                  }

                  setManualPinLocation({ latitude: centerLat, longitude: centerLng });
                  setManualAddressModal(false);
                  setTimeout(() => setMapPickerModal(true), 100); // Ensure state is set before opening modal
                }}              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Pick on map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1 }}
                onPress={() => {
                  setManualAddressModal(false);
                  clearDropdowns(); // <-- Add this
                }}
              >
                <Text style={{ textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Picker Modal */}
      <Modal visible={mapPickerModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 10, width: '95%', height: 400 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
              Pin the exact location of the emergency
            </Text>
            {manualPinLocation ? (
              <MapView
                style={{ flex: 1, borderRadius: 10 }}
                initialRegion={{
                  latitude: manualPinLocation.latitude,
                  longitude: manualPinLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={e => setManualPinLocation(e.nativeEvent.coordinate)}
              >
                <Marker
                  coordinate={manualPinLocation}
                  draggable
                  onDragEnd={e => setManualPinLocation(e.nativeEvent.coordinate)}
                />
              </MapView>
            ) : (
              <ActivityIndicator size="large" color="#C65D00" style={{ flex: 1 }} />
            )}
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#C65D00', padding: 10, borderRadius: 8, flex: 1, marginRight: 8 }}
                onPress={async () => {
                  setMapPickerModal(false);
                  setReportLocation(manualPinLocation);
                  setDisplayAddress('Fetching address...');
                  showConfirmOnLocationRef.current = true;
                  await handleUseCurrentLocation(manualPinLocation);
                  setConfirmModalVisible(true);
                  setSelectedFiles([]);
                }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Confirm Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1 }}
                onPress={() => {
                  setMapPickerModal(false);
                  setManualAddressModal(true);
                  fetchCurrentLocation(); // Reset location
                }}
              >
                <Text style={{ textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <TouchableOpacity
                onPress={() => {
                  setConfirmModalVisible(false);
                  setLocationChoiceModal(true);
                }}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="arrow-back" size={24} color="#C65D00" />
              </TouchableOpacity>
              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center', flex: 1 }}>
                Confirm Emergency Report?
              </Text>
            </View>
            {reportLocation && (
              <>
                <Text style={{ marginBottom: 12, textAlign: 'center', color: '#C65D00' }}>
                  Emergency Location:
                  {'\n'}Lat: {reportLocation.latitude}, Lng: {reportLocation.longitude}
                </Text>
            
                {/* Map Preview */}
                <View style={{ height: 180, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: reportLocation.latitude,
                      longitude: reportLocation.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    region={{
                      latitude: reportLocation.latitude,
                      longitude: reportLocation.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    pointerEvents="none"
                  >
                    <Marker
                      coordinate={reportLocation}
                      title="Emergency Location"
                      pinColor="red"
                    />
                  </MapView>
                </View>
              </>
            )}
            {displayAddress ? (
              <Text style={{ marginBottom: 8, textAlign: 'center', color: '#888' }}>
                Address: 
                {'\n'} {displayAddress}
              </Text>
            ) : (
              <Text style={{ marginBottom: 8, textAlign: 'center', color: '#888' }}>
                Fetching address...
              </Text>
            )}
            <TouchableOpacity onPress={pickFiles} style={{ marginTop: 15, marginBottom: 15, alignSelf: 'center', paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 8, width: '100%', backgroundColor: '#1976d2', borderRadius: 8 }}>
              <Text style={{ fontSize: 15, color: 'white', textAlign: 'center' }}>
                {selectedFiles.length > 0 ? 'Replace Files' : 'Upload image/video'}
              </Text>
            </TouchableOpacity>
            {selectedFiles.length > 0 && (
              <>
                <Text style={{ color: '#888', textAlign: 'center', marginBottom: 8 }}>
                  {selectedFiles.length} file(s) selected
                </Text>
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                  <ScrollView 
                    horizontal
                    contentContainerStyle={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center', // Add this
                    }}
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}>
                    {selectedFiles.map((file, idx) => {
                      const mimeType = file.mimeType || file.type || '';
                      return (
                        <View key={idx} style={{ position: 'relative', margin: 4 }}>
                          {mimeType.startsWith('image') ? (
                            <Image
                              source={{ uri: file.uri }}
                              style={{ width: 60, height: 60, borderRadius: 8}}
                            />
                          ) : mimeType.startsWith('video') ? (
                            <View style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#222' }}>
                              <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center' }}>Video</Text>
                            </View>
                          ) : null}
                          <TouchableOpacity
                            style={{
                              position: 'absolute', top: -15, right: -5, padding: 2, backgroundColor: '#fff', borderRadius: 50, elevation: 2,
                            }}
                            onPress={() => removeFile(idx)}
                          >
                            <Text style={{ fontSize: 20, color: 'red', fontWeight: 'bold' }}>×</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFiles([])}
                  style={{ alignSelf: 'center', marginBottom: 20 }}
                >
                  <Text style={{ color: 'red' }}>Clear Files</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ backgroundColor: '#C65D00', padding: 10, borderRadius: 8, flex: 1, marginRight: 8 }}
                disabled={submitting || !reportLocation}
                onPress={async () => {
                  setSubmitting(true);
                  setConfirmModalVisible(false);
                  await submitReport();
                  setSubmitting(false);
                  setSelectedFiles([]); // Clear files after submission
                  fetchCurrentLocation(); // Reset location
                }}
              >
                <Text style={{ fontSize: 15, color: '#fff', textAlign: 'center' }}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1 }}
                onPress={() => {
                  setConfirmModalVisible(false);
                  clearDropdowns(); // <-- Add this 
                  setSelectedFiles([]); // Clear files if cancelled
                  fetchCurrentLocation(); // Reset location
                }}
              >
                <Text style={{ fontSize: 15, textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Section */}
      <View style={styles.mapSection}>
        {locationLoading ? (
          <ActivityIndicator size="large" color="#C65D00" style={{ flex: 1 }} />
        ) : location ? (
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
            />
          </MapView>
        ) : (
          <Text style={styles.locationNotAvailable}>Location not available</Text>
        )}
      </View>

      {/* Recent Reports Section */}
      <View style={styles.recentReportsSection}>
        <View style={styles.recentReportsHeader}>
          <Text style={styles.recentReportsTitle}>My Recent Reports</Text>
          {recentReports.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/my-reports')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        {recentLoading ? (
          <ActivityIndicator size="small" color="#C65D00" />
        ) : recentReports.length === 0 ? (
          <Text style={styles.noReports}>No reports yet.</Text>
        ) : (
          recentReports.slice(0, 3).map((report) => {
            // Parse address if it's a stringified object
            let displayAddress = '';
            if (report.displayAddress) displayAddress = report.displayAddress;
            else if (typeof report.address === 'object' && report.address.display) displayAddress = report.address.display;
            else if (typeof report.address === 'string') {
              try {
                const addrObj = JSON.parse(report.address);
                displayAddress = addrObj.display || report.address;
              } catch {
                displayAddress = report.address;
              }
            }
            return (
              <TouchableOpacity 
                key={report._id} 
                onPress={() => router.push(`/report-details/${report._id}`)}
                style={[
                styles.reportItem,
                {
                  borderLeftColor:
                    report.status === 'resolved'
                      ? 'green'
                      : report.status === 'in_progress'
                      ? 'orange'
                      : '#C65D00',
                }
              ]}>
                <Text style={styles.reportType}>
                  {report.type}{report.subtype ? ` - ${report.subtype}` : ''}
                </Text>
                <Text style={styles.reportAddress}>
                  {displayAddress}
                </Text>
                <Text style={styles.reportDate}>
                  {new Date(report.clientSubmittedAt || report.createdAt).toLocaleString('en-PH', {
                    timeZone: 'Asia/Manila',
                    hour12: true,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })} PHT
                </Text>
                <Text style={[
                  styles.reportStatus,
                  {
                    color:
                      report.status === 'resolved'
                        ? 'green'
                        : report.status === 'in_progress'
                        ? 'orange'
                        : '#C65D00',
                  }
                ]}>
                  Status: {report.status.replace('_', ' ').toUpperCase()}
                </Text>
                {report.isFake && (
                  <Text style={styles.fakeReport}>
                    🚩 Marked as Fake
                    {report.fakeReason ? `: ${report.fakeReason}` : ''}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Safety Tips */}
      <View>
        <Text style={styles.safetyTipsTitle}>Safety Tips</Text>
        <Text>- Stay safe and follow official instructions.</Text>
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
  emergencyBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 9999,
    paddingVertical: 24,
    marginBottom: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  emergencyBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0008',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 15,
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  modalItemText: {
    fontSize: 15,
  },
  modalCancel: {
    fontSize: 15,
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalBackBtn: {
    marginRight: 8,
  },
  mapSection: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  locationNotAvailable: {
    textAlign: 'center',
    marginTop: 20,
  },
  recentReportsSection: {
    marginBottom: 16,
    marginTop: 16,
  },
  recentReportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentReportsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  viewAll: {
    color: '#C65D00',
    fontSize: 14,
  },
  noReports: {
    color: '#888',
  },
  reportItem: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  reportType: {
    fontWeight: 'bold',
  },
  reportAddress: {
    fontSize: 12,
    color: '#888',
  },
  reportDate: {
    fontSize: 12,
    color: '#888',
  },
  reportStatus: {
    fontWeight: 'bold',
    marginTop: 2,
  },
  fakeReport: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 4,
  },
  safetyTipsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default Home;