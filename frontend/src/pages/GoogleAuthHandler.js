import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';

const GoogleAuthHandler = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirect = params.get('redirect'); // Get the redirect path

    if (token) {
      localStorage.setItem('token', token); // Save the token to local storage

      // console.log('Token received:', token);
      // console.log('Redirecting to:', redirect);

      // Decode the token to extract user data
      const decodedUser = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      const user = {
        id: decodedUser.id,
        userName: decodedUser.userName,
        email: decodedUser.email,
        contactNumber: decodedUser.contactNumber,
        address: decodedUser.address,
        role: decodedUser.role,
        isProfileComplete: decodedUser.isProfileComplete,
        token,
      };

      localStorage.setItem('userId', decodedUser.id); // Save the user ID

      // Dispatch the user data to AuthContext
      dispatch({ type: 'LOGIN', payload: user });

      // Redirect based on the `redirect` query parameter
      setTimeout(() => {
        if (redirect === 'complete-profile') {
          navigate('/complete-profile');
        } else if (redirect === 'UserDashboard') {
          navigate('/UserDashboard');
        } else {
          navigate('/'); // Fallback to home page
        }
      }, 0); // Ensure redirection happens after state updates
    } else {
      navigate('/login'); // Redirect to login if no token is found
    }
  }, [dispatch, navigate]);

  return <div>Loading...</div>; // Show a loading message while processing
};

export default GoogleAuthHandler;