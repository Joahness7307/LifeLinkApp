import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const useFetchUser = (userId) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // console.log('Fetching user profile for ID:', userId); // Debug log

        // Get the authentication token
        const token = localStorage.getItem('token'); // Fetch the token directly
        // console.log('Token being sent:', token); // Debug log

        if (!token) {
          setError('Authentication token is missing.');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Send the token in the Authorization header
          },
        });

        const data = await response.json();
        if (response.ok) {
          // console.log('Fetched user profile:', data); // Debug log
          setUser(data);
        } else {
          setError(data.error);
          console.error('Failed to fetch user data:', data.error);
        }
      } catch (error) {
        setError(error.message);
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return { user, error };
};

export default useFetchUser;