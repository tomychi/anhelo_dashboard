import { Outlet, useLocation, Navigate, Route, Routes } from 'react-router-dom';
import { projectAuth } from '../firebase/config';
import { Comandera } from '../pages';
import { Marketing } from '../components/marketing/Marketing';

export const PrivateRoutesLayout = () => {
  const location = useLocation();
  const currentUserEmail = projectAuth.currentUser?.email;

  // Lista de correos con acceso limitado
  const limitedAccessEmails = [
    'cadetes@anhelo.com',
    'cocina@anhelo.com',
    'mostrador@anhelo.com',
  ];

  if (!projectAuth.currentUser) {
    // Si no hay usuario autenticado, redirige al login
    return <Navigate to="/authentication" state={{ from: location }} replace />;
  }

  if (currentUserEmail === 'tomas.arcostanzo5@gmail.com') {
    // Acceso completo para tomas.arcostanzo5@gmail.com
    return <Outlet />;
  }

  if (currentUserEmail === 'marketing@anhelo.com') {
    // Redirige a la ruta de marketing
    return (
      <Routes>
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/*" element={<Navigate to="/marketing" />} />
      </Routes>
    );
  }

  if (currentUserEmail && limitedAccessEmails.includes(currentUserEmail)) {
    // Acceso limitado para los correos específicos
    return (
      <Routes>
        <Route path="/comandas" element={<Comandera />} />
        <Route path="/*" element={<Navigate to="/comandas" />} />
      </Routes>
    );
  }

  // Para otros correos o si el correo es null/undefined
  return (
    <Routes>
      <Route path="/comandas" element={<Comandera />} />
      <Route path="/*" element={<Navigate to="/comandas" />} />
    </Routes>
  );
};
