// components/PrivateRoutesLayout.tsx
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getUserPermissions,
  hasPermissionForRoute,
} from "../utils/permissionsUtils";
import { RootState } from "../redux/configureStore";
import arrowIcon from "../assets/arrowIcon.png";

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
      <div className="flex flex-col font-coolvetica items-center justify-center h-[80vh]">
        <div className=" p-8 flex justify-center items-center flex-col text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-20 text-red-main"
          >
            <path
              fill-rule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
              clip-rule="evenodd"
            />
          </svg>

          <h1 className="text-2xl font-bold text-red-main mb-2">
            Acceso denegado
          </h1>
          <p className="font-light text-xs mb-4">
            No tienes permisos para acceder a este feature.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-200 text-red-main font-bold px-4 h-10 rounded-full   flex flex-row items-center mt-6 w-fit px-4 gap-2"
          >
            <img
              src={arrowIcon}
              className="h-2 transform rotate-180"
              alt="Volver"
              style={{
                filter:
                  "invert(20%) sepia(100%) saturate(5000%) hue-rotate(0deg) brightness(90%) contrast(150%)",
              }}
            />
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
