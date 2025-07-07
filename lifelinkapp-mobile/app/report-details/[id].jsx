import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../config';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import io from 'socket.io-client';
import { socketRef } from '../../utils/socketRef';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  function deg2rad(deg) { return deg * (Math.PI/180); }
  const R = 6371;
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // For preview modal
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewType, setPreviewType] = useState(null); // 'image' or 'video'
  const [previewUrl, setPreviewUrl] = useState(null);

  const [mapVisible, setMapVisible] = useState(false);
  const [departmentLocation, setDepartmentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [department, setDepartment] = useState(null);
  const [reporter, setReporter] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setReport(data);
        else setReport(null);
      } catch (e) {
        setReport(null);
      }
      setLoading(false);
    };
    if (id) fetchReport();
  }, [id]);

  useEffect(() => {
    const fetchReporter = async () => {
      if (!report?.userId) return;
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch(`${API_BASE_URL}/api/user/${report.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setReporter(data);
      } catch {}
    };
    if (report) fetchReporter();
  }, [report]);

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!report?.departmentId) return;
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch(`${API_BASE_URL}/api/departments/${report.departmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setDepartment(data);
      } catch {}
    };
    if (report) fetchDepartment();
  }, [report]);

  useEffect(() => {
    const fetchDepartmentLocation = async () => {
      if (!report?.departmentId) return;
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch(`${API_BASE_URL}/api/departments/${report.departmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.location) setDepartmentLocation(data.location);
      } catch {}
    };
    if (report) fetchDepartmentLocation();
  }, [report]);

  useEffect(() => {
     const setupSocket = async () => {
       const userId = await SecureStore.getItemAsync('userId');
       if (!userId) return;
 
       socketRef.current.on('connect', () => {
         console.log('User joined socket room:', userId);
         socketRef.current.emit('join_user', userId);
       });
 
       socketRef.current.on('disconnect', () => {
         console.log('User disconnected from socket', userId);
       });
 
       socketRef.current.on('report_status_updated', (data) => {
        // Only update if this is the report we're viewing
        if (data._id === id) {
          setReport(prev => ({
            ...prev,
            status: data.status,
            isFake: data.isFake,
            fakeReason: data.fakeReason,
            updatedAt: data.updatedAt,
          }));
        }
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
         // Do not disconnect here if other screens use the socketRef
       }
     };
   }, []);

  useEffect(() => {
    if (
      report?.location?.latitude && report?.location?.longitude &&
      departmentLocation?.latitude && departmentLocation?.longitude
    ) {
      setDistance(getDistanceFromLatLonInKm(
        report.location.latitude,
        report.location.longitude,
        departmentLocation.latitude,
        departmentLocation.longitude
      ));
    }
  }, [report, departmentLocation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C65D00" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#888' }}>Report not found.</Text>
      </View>
    );
  }

  // Parse address for display
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
    <View style={{ flex: 1, backgroundColor: '#F4F6F8' }}>
      <ScrollView contentContainerStyle={styles.container}>
       <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back('/home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#C65D00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 32 }} />
      </View>
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>
            {report.type}{report.subtype ? ` - ${report.subtype}` : ''}
          </Text>

          {/* Status and Fake */}
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[
              styles.value,
              {
                color:
                  report.status === 'resolved'
                    ? 'green'
                    : report.status === 'in_progress'
                    ? 'orange'
                    : '#C65D00',
                fontWeight: 'bold'
              }
            ]}>
              {report.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          {report.isFake && (
            <Text style={styles.fake}>
              🚩 Marked as Fake{report.fakeReason ? `: ${report.fakeReason}` : ''}
            </Text>
          )}

          {/* Distance and Map Button */}
          {departmentLocation && report.location && (
            <View style={styles.distanceBlock}>
              <Text style={styles.label}>
                Distance to Department:
                <Text style={styles.distanceValue}>
                  {' '}
                  {distance !== null ? `${distance.toFixed(2)} km` : '--'}
                </Text>
              </Text>
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => setMapVisible(true)}
              >
                <Text style={styles.mapBtnText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Map Modal */}
          <Modal visible={mapVisible} animationType="slide" transparent>
            <View style={styles.mapModalBg}>
              <View style={styles.mapModalContent}>
                <Text style={styles.mapModalTitle}>
                  Emergency & Department Location
                </Text>
                {departmentLocation && report.location ? (
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: report.location.latitude,
                      longitude: report.location.longitude,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: report.location.latitude,
                        longitude: report.location.longitude,
                      }}
                      pinColor="red"
                      title="Emergency Location"
                    />
                    <Marker
                      coordinate={{
                        latitude: departmentLocation.latitude,
                        longitude: departmentLocation.longitude,
                      }}
                      pinColor="blue"
                      title="Department Location"
                    />
                    <Polyline
                      coordinates={[
                        {
                          latitude: report.location.latitude,
                          longitude: report.location.longitude,
                        },
                        {
                          latitude: departmentLocation.latitude,
                          longitude: departmentLocation.longitude,
                        },
                      ]}
                      strokeColor="#C65D00"
                      strokeWidth={4}
                    />
                  </MapView>
                ) : (
                  <Text style={{ margin: 20, color: '#888' }}>Loading map...</Text>
                )}
                <Text style={styles.mapDistance}>
                  Distance: {distance !== null ? `${distance.toFixed(2)} km` : '--'}
                </Text>
                <TouchableOpacity
                  style={styles.closeMapBtn}
                  onPress={() => setMapVisible(false)}
                >
                  <Text style={styles.closeMapBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Address */}
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{displayAddress}</Text>
          </View>

          {/* Contact Info */}
          <View style={styles.row}>
            <Text style={styles.label}>Department Contact:</Text>
            <Text style={styles.value}>
              {department?.mobileNumbers?.[0] ||
              department?.landlineNumbers?.[0] ||
              'N/A'}
            </Text>
          </View>

          {/* Dates */}
          <View style={styles.row}>
            <Text style={styles.label}>Date Created:</Text>
            <Text style={styles.value}>
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
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last Updated:</Text>
            <Text style={styles.value}>
              {new Date(report.updatedAt).toLocaleString('en-PH', {
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
          </View>

          {/* Attachments */}
          {(report.imageURLs?.length > 0 || report.videoURLs?.length > 0) && (
            <View style={styles.attachmentsBlock}>
              <Text style={styles.label}>Attachments:</Text>
              <View style={styles.attachmentsRow}>
                {report.imageURLs?.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setPreviewType('image');
                      setPreviewUrl(url);
                      setPreviewVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.attachmentThumb}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
                {report.videoURLs?.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setPreviewType('video');
                      setPreviewUrl(url);
                      setPreviewVisible(true);
                    }}
                  >
                    <View style={styles.attachmentThumb}>
                      <Ionicons name="play-circle" size={36} color="#fff" style={{ alignSelf: 'center', marginTop: 24 }} />
                      <Text style={styles.attachmentVideoText}>Video</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewModalBg}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPreviewVisible(false)}
          />
          <View style={styles.previewModalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setPreviewVisible(false)}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
            {previewType === 'image' && (
              <Image
                source={{ uri: previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            {previewType === 'video' && (
              <Video
                source={{ uri: previewUrl }}
                style={styles.previewVideo}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 18,
    marginBottom: 18,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 18,
    color: '#222',
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    color: '#555',
    fontSize: 15,
    minWidth: 110,
  },
  value: {
    color: '#333',
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  fake: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  distanceBlock: {
    marginTop: 16,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  distanceValue: {
    color: '#C65D00',
    fontWeight: 'bold',
  },
  mapBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 20,
  },
  mapBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mapModalBg: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: '95%',
    height: 420,
    alignItems: 'center',
  },
  mapModalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  map: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
  },
  mapDistance: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C65D00',
  },
  closeMapBtn: {
    marginTop: 20,
    backgroundColor: '#1976d2',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 8,
  },
  closeMapBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  attachmentsBlock: {
    marginTop: 18,
  },
  attachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  attachmentThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#bbb',
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  attachmentVideoText: {
    color: '#fff',
    fontSize: 13,
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  previewModalBg: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '95%',
    maxHeight: '85%',
    minWidth: 280,
    minHeight: 200,
    elevation: 5,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    elevation: 2,
  },
  previewImage: {
    width: 320,
    height: 320,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  previewVideo: {
    width: 320,
    height: 320,  
    borderRadius: 10,
    backgroundColor: '#000',
  },
});