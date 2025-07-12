import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { socketRef } from '../utils/socketRef';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { imagess } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch('https://lifelink-backend-izjs.onrender.com/api/user/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setUser(data);
        else setUser(null);
      } catch {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const pickAndUploadProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      setUploading(true);

    // Compress and resize image before upload
    const manipResult = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

      const formData = new FormData();
      formData.append('profilePicture', {
        uri: image.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });

      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`https://lifelink-backend-izjs.onrender.com/api/user/${user._id}/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        await SecureStore.setItemAsync('user', JSON.stringify(updated));
        setUser(updated);
      } else {
        alert('Failed to upload profile picture');
      }
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('expoPushToken');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    router.replace('/sign-in');
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#C65D00" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Unable to load profile.</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.profileContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#C65D00" />
        </TouchableOpacity>
      </View>
      <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <TouchableOpacity
          onPress={editMode ? pickAndUploadProfileImage : undefined}
          disabled={!editMode}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <Image
            source={user.profilePicture ? { uri: user.profilePicture } : imagess.profile}
            style={styles.profileImg}
          />
          {uploading && (
            <ActivityIndicator style={{ position: 'absolute', top: 35, left: 35 }} />
          )}
          {editMode && (
            <Text style={{ textAlign: 'center', color: '#C65D00', marginTop: 4, fontSize: 14 }}>
              Tap to change photo
            </Text>
          )}
        </TouchableOpacity>
      </View>
        {editMode ? (
          <>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={editUserName}
              onChangeText={setEditUserName}
              placeholder="Username"
              accessibilityLabel='Username-Input'
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel='Email-Input'
            />
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={editContactNumber}
              onChangeText={setEditContactNumber}
              placeholder="09XXXXXXXXX"
              keyboardType="phone-pad"
              accessibilityLabel='Contact-Number-Input'
            />
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.logoutBtnMain, { flex: 1, marginRight: 8, backgroundColor: '#1976d2' }]}
                onPress={async () => {
                  // --- Add validation here ---
                  if (!editEmail.match(/^\S+@\S+\.\S+$/)) {
                    alert('Invalid email address');
                    return;
                  }
                  if (!editContactNumber.match(/^09\d{9}$/)) {
                    alert('Invalid Philippine contact number');
                    return;
                  }
                  setSaving(true);
                  try {
                    const token = await SecureStore.getItemAsync('token');
                    const res = await fetch(`https://lifelink-backend-izjs.onrender.com/api/user/${user._id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        userName: editUserName,
                        email: editEmail,
                        contactNumber: editContactNumber,
                      }),
                    });
                    // --- Handle token expiry here ---
                    if (res.status === 401) {
                      alert('Session expired. Please log in again.');
                      await handleLogout();
                      return;
                    }
                    if (res.ok) {
                      const updated = await res.json();
                      await SecureStore.setItemAsync('user', JSON.stringify(updated));
                      setUser(updated);
                      setEditMode(false);
                    } else {
                      alert('Failed to update profile');
                    }
                  } catch (e) {
                    alert('Error updating profile');
                  }
                  setSaving(false);
                }}
                accessibilityLabel='Save-Profile-Button'
                disabled={saving}
              >
                <Text style={styles.logoutBtnTextMain}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutBtnMain, { flex: 1, backgroundColor: '#bbb', marginLeft: 8 }]}
                onPress={() => setEditMode(false)}
                disabled={saving}
                accessibilityLabel='Cancel-Edit-Profile-Button'
              >
                <Text style={styles.logoutBtnTextMain}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.userName}>{user.userName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.contactNumber}>{user.contactNumber}</Text>
          </>
        )}
            {!editMode && (
        <TouchableOpacity
          style={[styles.logoutBtnMain, { backgroundColor: '#888', marginTop: 16 }]}
          onPress={() => {
            setEditUserName(user.userName || '');
            setEditEmail(user.email || '');
            setEditContactNumber(user.contactNumber || '');
            setEditMode(true);
          }}
          accessibilityLabel='Edit-Profile-Button'
        >
          <Text style={styles.logoutBtnTextMain}>Edit Profile</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutBtnMain}
        accessibilityLabel='Logout-Button'
      >
        <Text style={styles.logoutBtnTextMain}>Logout</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
  },
   backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    color: '#C65D00',
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: '#C65D00',
    padding: 12,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  profileImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C65D00',
  },
  userName: {
    color: '#232526',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 12,
  },
  email: {
    color: '#414345',
    fontSize: 16,
    marginBottom: 4,
  },
  contactNumber: {
    color: '#414345',
    fontSize: 16,
    marginBottom: 16,
  },
  label: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#232526',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 4,
    fontSize: 16,
  },
  logoutBtnMain: {
    backgroundColor: '#C65D00',
    padding: 14,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutBtnTextMain: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Profile;