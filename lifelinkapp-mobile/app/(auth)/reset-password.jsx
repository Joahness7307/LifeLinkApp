// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { API_BASE_URL } from '../../config';
// import { useLocalSearchParams, useRouter } from 'expo-router';

// export default function ResetPasswordScreen() {
//   const { token } = useLocalSearchParams();
//   const router = useRouter();
//   const [newPassword, setNewPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleReset = async () => {
//     if (!newPassword || newPassword.length < 6) {
//       Alert.alert('Password must be at least 6 characters.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/api/password/reset-password`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token, newPassword }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         Alert.alert('Success', data.message || 'Password reset successful.');
//         router.replace('/sign-in');
//       } else {
//         Alert.alert('Error', data.error || 'Failed to reset password.');
//       }
//     } catch (e) {
//       Alert.alert('Error', 'Network error.');
//     }
//     setLoading(false);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Reset Password</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter new password"
//         secureTextEntry
//         value={newPassword}
//         onChangeText={setNewPassword}
//       />
//       <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
//         <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB' },
//   title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
//   input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fff' },
//   button: { backgroundColor: '#C65D00', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
// });