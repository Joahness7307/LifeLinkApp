import { Navigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthContext();

  // if (!user) {
  //   const storedUser = localStorage.getItem('user');
  //   if (storedUser) {
  //     const parsedUser = JSON.parse(storedUser);
  //     if (parsedUser.token) {
  //       return children;
  //     }
  //   }
  //   return <Navigate to="/login" />;
  // }

  return children;
};

export default ProtectedRoute;