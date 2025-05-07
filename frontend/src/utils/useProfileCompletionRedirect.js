import { useNavigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';

const useProfileCompletionRedirect = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const redirectIfIncomplete = (targetPath) => {
    if (user && !user.isProfileComplete) {
      navigate('/complete-profile'); // Redirect to Complete Profile page
    } else {
      navigate(targetPath); // Navigate to the target path
    }
  };

  return { redirectIfIncomplete };
};

export default useProfileCompletionRedirect;