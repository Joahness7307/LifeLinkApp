import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthContext from './useAuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  const login = async (identifier, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/login`, {
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
          departmentId: data.departmentId || null,
        };

        dispatch({ type: 'LOGIN', payload: user });

        // Redirect based on role
        if (data.role === 'publicUser') {
          if (!data.isProfileComplete) {
            navigate('/complete-profile'); // Redirect to Complete Profile
          } else {
            navigate('/PublicUserDashboard'); // Redirect to Public User Dashboard
          }
        } else if (data.role === 'departmentAdmin') {
          console.log('Login data:', data);
          console.log('Assigned area:', data.assignedArea);
          console.log('Department:', data.assignedArea && data.assignedArea.department);
          // Set departmentId in local storage
          if (data.assignedArea && data.assignedArea.department) {
            localStorage.setItem('departmentId', data.assignedArea.department._id);
          }
          navigate('/DepartmentAdminDashboard'); // Redirect to Department Admin Dashboard
        } else if (data.role === 'cityAdmin') {
          navigate('/CityAdminDashboard'); // Redirect to City Admin Dashboard
        } else if (data.role === 'provinceAdmin') {
          navigate('/ProvinceAdminDashboard'); // Redirect to Province Admin Dashboard
        } else if (data.role === 'regionAdmin') {
          navigate('/RegionAdminDashboard'); // Redirect to Region Admin Dashboard
        } else if (data.role === 'superAdmin') {
          navigate('/SuperAdminDashboard'); // Redirect to Region Admin Dashboard
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