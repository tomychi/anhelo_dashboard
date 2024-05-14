import { Outlet, useLocation, Navigate, Route, Routes } from 'react-router-dom';
import { projectAuth } from '../firebase/config';
import { Comandera } from '../pages';

export const PrivateRoutesLayout = () => {
  const location = useLocation();
  const currentUserEmail = projectAuth.currentUser?.email;

  if (
    currentUserEmail === 'cadetes@anhelo.com' ||
    currentUserEmail === 'cocina@anhelo.com' ||
    currentUserEmail === 'mostrador@anhelo.com'
  ) {
    return (
      <Routes>
        <Route path="/comandas" element={<Comandera />} />
        <Route path="/*" element={<Navigate to="/comandas" />} />
      </Routes>
    );
  } else {
    return projectAuth.currentUser ? (
      <Outlet />
    ) : (
      <Navigate to="/authentication" state={{ from: location }} replace />
    );
  }
};
