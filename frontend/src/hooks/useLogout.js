import useAuthContext from './useAuthContext';

export const useLogout = () => {
  const { dispatch } = useAuthContext();

  const logout = () => {
    // Remove user-related data from local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('departmentId');

    // Dispatch logout action
    dispatch({ type: 'LOGOUT' });
  };

  return { logout };
};