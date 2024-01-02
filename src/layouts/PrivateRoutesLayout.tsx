import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { projectAuth } from '../firebase/config';
import { useSelector } from 'react-redux';

export const PrivateRoutesLayout = () => {
  const location = useLocation();

  const { isAuth } = useSelector((state) => state.auth);

  return projectAuth.currentUser ? (
    <Outlet />
  ) : (
    <Navigate to="/authentication" state={{ from: location }} replace />
  );
};
