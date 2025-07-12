import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import io from 'socket.io-client';
import { socketRef } from '../utils/socketRef';
import { API_BASE_URL } from '../config';

const SOCKET_URL = 'https://lifelink-backend-izjs.onrender.com';

const MyReports = () => {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch all reports for the user
  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/reports/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllReports(data);
      else setAllReports([]);
    } catch (e) {
      setAllReports([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

  // --- Real-time updates via socket.io ---
  useEffect(() => {
    let userId;
    const setupSocket = async () => {
      userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL);
      }

      socketRef.current.on('connect', () => {
        socketRef.current.emit('join_user', userId);
      });

      socketRef.current.on('report_status_updated', (data) => {
        setAllReports((prevReports) =>
          prevReports.map((r) =>
            r._id === data._id ? { ...r, status: data.status, updatedAt: data.updatedAt, isFake: data.isFake, fakeReason: data.fakeReason } : r
          )
        );
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F2F2F2' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 28 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 20 }}>My Reports</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#C65D00', fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#C65D00" />
      ) : allReports.length === 0 ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No reports yet.</Text>
      ) : (
        allReports.map((report) => {
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
              style={{
              padding: 12,
              backgroundColor: '#fff',
              borderRadius: 8,
              marginBottom: 12,
              borderLeftWidth: 5,
              borderLeftColor:
                report.status === 'resolved'
                  ? 'green'
                  : report.status === 'in_progress'
                  ? 'orange'
                  : '#C65D00',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 4,
              elevation: 2,
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>
                {report.type}{report.subtype ? ` - ${report.subtype}` : ''}
              </Text>
              <Text style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>
                {displayAddress}
              </Text>
              <Text style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
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
              <Text style={{
                color:
                  report.status === 'resolved'
                    ? 'green'
                    : report.status === 'in_progress'
                    ? 'orange'
                    : '#C65D00',
                fontWeight: 'bold',
                marginTop: 2,
                fontSize: 13
              }}>
                Status: {report.status.replace('_', ' ').toUpperCase()}
              </Text>
              {/* Add this for fake report display */}
                {report.isFake && (
                  <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 4 }}>
                    🚩 Marked as Fake
                    {report.fakeReason ? `: ${report.fakeReason}` : ''}
                  </Text>
                )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

export default MyReports;