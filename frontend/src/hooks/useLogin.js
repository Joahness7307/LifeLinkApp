import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthContext from './useAuthContext';

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  const login = async (identifier, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); // Save the token to local storage

        const user = {
          id: data._id,
          userName: data.userName,
          email: data.email,
          contactNumber: data.contactNumber,
          address: data.address,
          role: data.role,
          isProfileComplete: data.isProfileComplete,
          token: data.token,
        };

        dispatch({ type: 'LOGIN', payload: user });

        if (data.isProfileComplete) {
          navigate('/UserDashboard'); // Redirect to the UserDashboard if profile is complete
        } else {
          navigate('/complete-profile'); // Redirect to Complete Profile if profile is incomplete
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};