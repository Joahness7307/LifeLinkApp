import { View, Text, Image, ScrollView, BackHandler, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { imagess } from '../../constants'
import { Link } from 'expo-router';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import * as SecureStore from 'expo-secure-store';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '../../config';
import NetInfo from '@react-native-community/netinfo';

const SignIn = () => {
  const { setUser } = useContext(AuthContext);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace('/'); // Redirect to landing screen (index.jsx)
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const [form, setForm] = React.useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const submit = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      alert('You need an internet connection to sign in.');
      return;
    }

    // 1. Frontend validation
    if (!form.email || !form.password) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      // 2. Only proceed if the response is ok
      if (response.ok && data.token) {
        // 3. Save the token to secure storage
        await SecureStore.setItemAsync('token', data.token);
        // Save the userId to secure storage
        await SecureStore.setItemAsync('userId', data._id);
        await SecureStore.setItemAsync('user', JSON.stringify(data));
        // 4. Update the AuthContext with user data
        setUser(data);
        router.replace('/home');
      } else {
        alert(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      alert('An error occurred. Please try again later.');
      console.error('Error during login:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={imagess.appLogo}
              alt="LifeLink Logo"
              resizeMode='contain'
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>Log in to LifeLink</Text>

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

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
{/*           <View style={styles.forgotContainer}>
            <Link href="/forgot-password" style={styles.forgotText}>
              Forgot Password?
            </Link>
          </View> */}

          <CustomButton
            title="Log In"
            handlePress={submit}
            containerStyles={styles.signInButton}
            isLoading={isSubmitting}
            accessibilityLabel="SignIn-Button"
          />

          <View style={styles.row}>
            <Text style={styles.rowText}>
              Don't have an account?
            </Text>
            <Link
              href="/sign-up"
              replace
              style={styles.link}
            >
              Signup
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
  forgotContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 0,
    marginBottom: 0,
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#EA580C',
    marginBottom: 0,
  },
  signInButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    marginTop: 28,
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

export default SignIn
