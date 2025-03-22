import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthContext from "./useAuthContext";

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save the user to local storage
        localStorage.setItem('user', JSON.stringify(data));

        // Update the auth context
        dispatch({ type: 'LOGIN', payload: data });

        // Redirect to the EmergencyList page
        navigate('/emergencies');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to log in. Please try again.');
    }
  };

  return { login, isLoading, error };
};