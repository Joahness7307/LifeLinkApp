import { useState, useEffect } from 'react';

const useFetchUser = (userId) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the authentication token
        const storedUser = localStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const token = parsedUser ? parsedUser.token : null;

        const response = await fetch(`/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (response.ok) {
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