import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Example: Load user from SecureStore on app start
  useEffect(() => {
    const loadUser = async () => {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};