// components/PrivateRoutesLayout.tsx
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getUserPermissions,
  hasPermissionForRoute,
} from "../utils/permissionsUtils";
import { RootState } from "../redux/configureStore";

interface PrivateRoutesLayoutProps {
  children: ReactNode;
}

const PrivateRoutesLayout: React.FC<PrivateRoutesLayoutProps> = ({
  children,
}) => {
  const location = useLocation();
  const auth = useSelector((state: RootState) => state.auth);

  // Si no está autenticado, redirigir al login
  if (!auth?.isAuth) {
    return <Navigate to="/" />;
  }

  // Obtener permisos del usuario
  const userPermissions = getUserPermissions(auth);

  // Verificar si tiene permiso para la ruta actual
  const hasPermission = hasPermissionForRoute(
    location.pathname,
    userPermissions,
    auth?.tipoUsuario
  );

  if (!hasPermission) {
    // Mostrar mensaje de error de permisos
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="bg-red-50 p-8 rounded-lg shadow-md text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Acceso denegado
          </h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si tiene permisos, renderizar la página
  return <>{children}</>;
};

export default PrivateRoutesLayout;
