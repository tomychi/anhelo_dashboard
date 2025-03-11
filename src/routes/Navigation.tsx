import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Authentication, Error } from "../pages";
import { DashboardMainPage } from "../pages/DashboardMainPage";
import CrearEmpresa from "../pages/CrearEmpresa";

export const Navigation = ({ backendStatus }) => {
  return (
    <Router>
      <div className="h-screen overflow-x-hidden">
        <Routes>
          <Route path="/authentication" element={<Authentication />} />

          <Route
            path="/*"
            element={<DashboardMainPage backendStatus={backendStatus} />}
          />

          {/* Manejo de cualquier ruta no encontrada */}
          <Route path="*" element={<Error />} />
        </Routes>
      </div>
    </Router>
  );
};
