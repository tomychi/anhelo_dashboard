import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { DashboardMainPage } from "../pages/DashboardMainPage";
import CrearEmpresa from "../pages/CrearEmpresa";
import { Login } from "../components/auth/Login";

export const Navigation = ({ backendStatus }) => {
  return (
    <Router>
      <div className="h-screen overflow-x-hidden">
        <Routes>
          <Route path="/authentication" element={<Login />} />

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
