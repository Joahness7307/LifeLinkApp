import { createContext, useReducer, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { user: null });
  const [authIsReady, setAuthIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decodedUser = jwtDecode(storedToken); // Decode the token to get user data
        // console.log('Decoded Token:', decodedUser); // Log the decoded token
        const user = {
          id: decodedUser.id || decodedUser._id || '',
          userName: decodedUser.userName || 'Guest',
          email: decodedUser.email || '',
          contactNumber: decodedUser.contactNumber || '',
          address: decodedUser.address || {},
          role: decodedUser.role || 'user', // Ensure the role is restored
          // Only include isProfileComplete for public users
          isProfileComplete: decodedUser.role === 'publicUser' ? decodedUser.isProfileComplete || false : undefined,
          token: storedToken, // Include the token
          departmentId: decodedUser.departmentId || null,
          
        };
        dispatch({ type: 'LOGIN', payload: user });
      } catch (error) {
        console.error('Failed to decode token from local storage', error);
      }
    }
    setAuthIsReady(true); // Ensure authIsReady is set to true after initialization
  }, []);
  

  if (!authIsReady) {
    return <div>Loading...</div>; // Optional loading spinner
  }

  return (
    <AuthContext.Provider value={{ ...state, dispatch, authIsReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthContextProvider;