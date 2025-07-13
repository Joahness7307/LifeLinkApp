import { View, Text, Image, ScrollView, BackHandler, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { imagess } from '../../constants'
import { Link, router, useFocusEffect } from 'expo-router';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { API_BASE_URL } from '../../config';
import NetInfo from '@react-native-community/netinfo';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';
import { useRouter } from 'expo-router';

const SignUp = () => {
  const { setUser } = useContext(AuthContext);
  const router = useRouter();

  const [showResend, setShowResend] = React.useState(false);

  const handleResendVerification = async () => {
    const response = await fetch(`${API_BASE_URL}/api/user/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email }),
    });
    const data = await response.json();
    alert(data.message || data.error);
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace('/sign-in'); // Go to sign-in
        return true; // Prevent default back
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const [form, setForm] = React.useState({
    username: '',
    email: '',
    password: '',
    contactNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateEmail = (email) => {
    // Simple regex for email validation
    return /\S+@\S+\.\S+/.test(email);
  };

  const isValidPHNumber = (number) => {
    // Mobile: 09XXXXXXXXX
    const mobile = /^09\d{9}$/;
    // Landline: 02XXXXXXX or 0XXYYYYYYY
    const landline = /^0\d{9,10}$/;
    return mobile.test(number) || landline.test(number);
  };

  const submit = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      alert('You need an internet connection to sign in.');
      return;
    }

    // 1. Check if any field is empty
    if (!form.username || !form.email || !form.password) {
      alert('Please fill in all fields');
      return;
    }
    // 2. Check username length
    if (!form.username || form.username.length < 3) {
      alert('Username must be at least 3 characters long');
      return;
    }
    // 3. Check email format
    if (!form.email || !validateEmail(form.email)) {
      alert('Please enter a valid email address');
      return;
    }
    // 4. Check password length
    if (!form.password || form.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    // 5. Check contact number length
    if (!form.contactNumber || !isValidPHNumber(form.contactNumber)) {
      alert('Please enter a valid Philippine mobile or landline number');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: form.username, // match backend field
          email: form.email,
          password: form.password,
          contactNumber: form.contactNumber,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Registration successful, redirect to sign-in
        alert('Registration successful! Please check your email to verify your account.');
        setShowResend(true); // Show resend option
        router.replace('/sign-in');
      } else {
        // Show backend error
        alert(data.error || data.message || 'Registration failed.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={imagess.appLogo}
              alt="LifeLink Logo"
              resizeMode='contain'
              style={styles.logo}
            />
        </View>
          <Text style={styles.title}>Sign Up to LifeLink</Text>

          <FormField
            title="Username"
            value={form.username}
            placeholder="Username"
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles={{ marginTop: 8 }}
            autoCapitalize="none"
            accessibilityLabel="Username-Input"
          />

          <FormField
            title="Email"
            value={form.email}
            placeholder="Email"
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles={{ marginTop: 8 }}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email-Input"
          />

          <FormField
            title="Password"
            value={form.password}
            placeholder="Password"
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles={{ marginTop: 8 }}
            accessibilityLabel="Password-Input"
          />

          <FormField
            title="Contact Number"
            value={form.contactNumber}
            placeholder="Contact Number"
            handleChangeText={(e) => setForm({ ...form, contactNumber: e })}
            otherStyles={{ marginTop: 8 }}
            keyboardType="phone-pad"
            accessibilityLabel="Contact-Number-Input"
          />

          <CustomButton
            title="Sign Up"
            handlePress={submit}
            containerStyles={styles.signUpButton}
            isLoading={isSubmitting}
          />

          {showResend && (
            <TouchableOpacity onPress={handleResendVerification}>
              <Text style={styles.resendText}>
                Resend Verification Email
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.row}>
            <Text style={styles.rowText}>
              Already have an account?
            </Text>
            <Link
              href="/sign-in"
              replace
              style={styles.link}
            >
              Login
            </Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 600,
    paddingHorizontal: 20,
    marginVertical: 32,
  },
   logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 32,
  },
  logo: {
    width: 210,
    height: 80,
  },
  title: {
    fontSize: 18,
    color: '#525252',
    marginTop: 40,
    marginBottom: 32,
    fontFamily: 'Poppins-Medium',
  },
  signUpButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    marginTop: 28,
  },
  resendText: {
    color: '#C65D00',
    textAlign: 'center',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  rowText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Poppins-Regular',
  },
  link: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#EA580C',
    marginLeft: 4,
  },
  googleButton: {
    backgroundColor: '#D1D5DB',
    width: '100%',
    height: 48,
    borderRadius: 24,
    marginTop: 16,
  },
});

export default SignUp