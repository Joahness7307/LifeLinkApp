import { useState } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const signup = async ( userName, email, password, contactNumber, address) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, email, password, contactNumber, address }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        setError(data.error);
        return false;
      } else {
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