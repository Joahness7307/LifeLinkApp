import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar, View, StyleSheet } from 'react-native'

const AuthLayout = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="orange" />
      <Stack>
        <Stack.Screen 
          name="sign-in"
          options={{
            headerTitle: '',
            headerShown: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen 
          name="sign-up"
          options={{
            headerTitle: '',
            headerShown: false,
            headerLeft: () => null,
          }}
        />
      </Stack>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB', // Tailwind's bg-gray-50
    flex: 1,
    height: '100%',
  },
});

export default AuthLayout