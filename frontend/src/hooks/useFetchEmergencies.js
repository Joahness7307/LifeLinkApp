import { useState, useEffect } from 'react';
import useAuthContext from './useAuthContext';

const useFetchEmergencies = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const token = parsedUser ? parsedUser.token : null;

        const response = await fetch('/api/emergencies', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setEmergencies(data);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError(error.message);
      }
    };

    if (user) {
      fetchEmergencies();
    }
  }, [user]);

  return { emergencies, error };
};

export default useFetchEmergencies;