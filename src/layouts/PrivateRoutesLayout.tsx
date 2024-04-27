import { Outlet, useLocation, Navigate, Route, Routes } from 'react-router-dom';
import { projectAuth } from '../firebase/config';
import { Comandera } from '../pages';

export const PrivateRoutesLayout = () => {
  const location = useLocation();
  const currentUserEmail = projectAuth.currentUser?.email;

  console.log(currentUserEmail);
  if (
    currentUserEmail === 'cadetes@anhelo.com' ||
    currentUserEmail === 'cocina@anhelo.com'
  ) {
    // Si el usuario es cadetes@anhelo.com, solo tiene acceso a la ruta "/comandas"
    return (
      <Routes>
        <Route path="/comandas" element={<Comandera />} />
        <Route path="/*" element={<Navigate to="/comandas" />} />
      </Routes>
    );
  }

  return projectAuth.currentUser ? (
    <Outlet />
  ) : (
    <Navigate to="/authentication" state={{ from: location }} replace />
  );
};
