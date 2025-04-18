import useAuthContext from './useAuthContext';

export const useLogout = () => {
  const { dispatch } = useAuthContext();

  const logout = () => {
    // Remove user from local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Dispatch logout action
    dispatch({ type: 'LOGOUT' });
  };

  return { logout };
};