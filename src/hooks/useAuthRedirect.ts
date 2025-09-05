import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useAuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const setRedirectPath = useCallback((path?: string) => {
    const redirectPath = path || location.pathname + location.search;
    sessionStorage.setItem("redirectAfterLogin", redirectPath);
  }, [location.pathname, location.search]);

  const navigateToAuth = useCallback((authType: 'signin' | 'register' = 'signin') => {
    setRedirectPath();
    navigate(`/auth/${authType}`);
  }, [navigate, setRedirectPath]);

  const clearRedirectPath = useCallback(() => {
    sessionStorage.removeItem("redirectAfterLogin");
  }, []);

  return {
    setRedirectPath,
    navigateToAuth,
    clearRedirectPath
  };
};
