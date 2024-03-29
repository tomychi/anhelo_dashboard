import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Authentication, Error } from '../pages';
import { PrivateRoutesLayout } from '../layouts/PrivateRoutesLayout';
import { DashboardMainPage } from '../pages/DashboardMainPage';

export const Navigation = () => {
  return (
    <Router>
      <div className="h-screen  overflow-x-hidden">
        <Routes>
          {/* Rutas para el cliente */}
          <Route path="/authentication" element={<Authentication />} />

          {/* Rutas para el dashboard */}
          <Route element={<PrivateRoutesLayout />}>
            <Route path="/*" element={<DashboardMainPage />} />
          </Route>

          {/* Manejo de cualquier ruta no encontrada */}
          <Route path="*" element={<Error />} />
        </Routes>
      </div>
    </Router>
  );
};
