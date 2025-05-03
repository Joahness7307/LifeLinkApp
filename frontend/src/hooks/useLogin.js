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
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save the user to local storage
        localStorage.setItem('user', JSON.stringify(data)); // Keep the full user object
        localStorage.setItem('token', data.token); // Store the token separately

        // Update the auth context
        dispatch({ type: 'LOGIN', payload: data });

        // Redirect based on the user's role
        if (data.role === 'responder') {
          navigate('/ResponderDashboard'); // Redirect responders to their dashboard
        } else if (data.role === 'user') {
          navigate('/UserDashboard'); // Redirect regular users to the emergencies page
        } else {
          navigate('/'); // Redirect other roles to the home page
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};