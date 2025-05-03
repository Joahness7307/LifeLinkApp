import { useState } from 'react';
// import useAuthContext from './useAuthContext';

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // const { dispatch } = useAuthContext();

  const signup = async (userName, email, password, phoneNumber, address, role, agencyId, latitude, longitude) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, email, password, phoneNumber, address, role, agencyId, latitude, longitude })
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        setError(data.error);
        return false;
      } else {
        // Do not save the user to local storage
        // localStorage.setItem('user', JSON.stringify(data));

        // Update the auth context
        // dispatch({ type: 'LOGIN', payload: data });

        setIsLoading(false);
        return true;
      }
    } catch (error) {
      setIsLoading(false);
      setError('Failed to sign up. Please try again.');
      return false;
    }
  };

  return { signup, isLoading, error };
};