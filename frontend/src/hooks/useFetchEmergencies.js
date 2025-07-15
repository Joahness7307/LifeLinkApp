import { useState, useEffect } from 'react';
import useAuthContext from './useAuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const useFetchEmergencies = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        // Retrieve the token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authorization token is missing');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/emergencies`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (response.ok) {
          setEmergencies(data);
        } else {
          setError(data.error || 'Failed to fetch emergencies');
        }
      } catch (error) {
        setError(error.message || 'An error occurred while fetching emergencies');
      }
    };

    if (user) {
      fetchEmergencies();
    }
  }, [user]);

  return { emergencies, error };
};

export default useFetchEmergencies;