import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { staticDepartments } from '../constants/emergencyContacts';

const EmergencyContacts = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.warning}>
        Warning: Emergency numbers are for real emergencies only. False or prank calls are punishable by law.
      </Text>
      {staticDepartments.map((dept, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.name}>{dept.name}</Text>
          <Text style={styles.address}>{dept.address}</Text>
          {dept.metroManilaOnly && (
            <Text style={{ color: '#C65D00', fontSize: 13, marginBottom: 4 }}>
              * For Metro Manila residents only
            </Text>
          )}
          {dept.mobileNumbers.map((num, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${num}`)}>
              <Text style={styles.phone}>📱 {num}</Text>
            </TouchableOpacity>
          ))}
          {dept.landlineNumbers.map((num, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${num}`)}>
              <Text style={styles.phone}>☎️ {num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <Text style={styles.disclaimer}>
        For local emergencies, contact your nearest police, fire, or hospital if available.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#C65D00', textAlign: 'center' },
  warning: { color: 'red', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  address: { color: '#888', marginBottom: 6 },
  phone: { color: '#1976d2', fontSize: 15, marginBottom: 2, textDecorationLine: 'underline' },
  disclaimer: { color: '#888', fontSize: 14, marginTop: 24, textAlign: 'center' },
});

export default EmergencyContacts;