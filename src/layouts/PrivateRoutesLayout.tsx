import { Outlet, useLocation, Navigate, Route, Routes } from 'react-router-dom';
import { projectAuth } from '../firebase/config';
import { Comandera } from '../pages';
import { Marketing } from '../components/marketing/Marketing';

export const PrivateRoutesLayout = () => {
  const location = useLocation();
  const currentUserEmail = projectAuth.currentUser?.email;

  // Lista de correos con acceso limitado a Comandas
  const limitedAccessEmails = [
    'cadetes@anhelo.com',
    'cocina@anhelo.com',
    'mostrador@anhelo.com',
  ];

  if (!projectAuth.currentUser) {
    // Si no hay usuario autenticado, redirige al login
    return <Navigate to="/authentication" state={{ from: location }} replace />;
  }

  // Acceso completo para tomas.arcostanzo5@gmail.com
  if (currentUserEmail === 'tomas.arcostanzo5@gmail.com') {
    return <Outlet />;
  }

  // Acceso a Marketing para marketing@anhelo.com
  if (currentUserEmail === 'marketing@anhelo.com') {
    return (
      <Routes>
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/*" element={<Navigate to="/marketing" />} />
      </Routes>
    );
  }

  // Acceso limitado a Comandas para los usuarios en limitedAccessEmails
  if (currentUserEmail && limitedAccessEmails.includes(currentUserEmail)) {
    return (
      <Routes>
        <Route path="/comandas" element={<Comandera />} />
        <Route path="/*" element={<Navigate to="/comandas" />} />
      </Routes>
    );
  }

  // Para cualquier otro caso (acceso predeterminado)
  return (
    <Routes>
      <Route path="/comandas" element={<Comandera />} />
      <Route path="/*" element={<Navigate to="/comandas" />} />
    </Routes>
  );
};
