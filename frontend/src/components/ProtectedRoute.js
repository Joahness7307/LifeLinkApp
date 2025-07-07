import { Navigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Only redirect to complete-profile if publicUser and not complete
  if (user.role === 'publicUser' && !user.isProfileComplete) {
    return <Navigate to="/complete-profile" />;
  }

  return children;
};

export default ProtectedRoute;