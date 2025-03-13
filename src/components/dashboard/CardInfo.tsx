import React, { useRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { projectAuth } from "../../firebase/config";
import arrow from "../../assets/arrowIcon.png";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  EmpleadoProps,
  EmpresaProps,
  updateKpiConfig,
} from "../../firebase/ClientesAbsolute";

// Importar el modal para configurar acceso
import KpiAccessModal from "./KpiAccessModal";

interface CardInfoProps {
  info: string | number;
  title: string;
  link?: string;
  cuadrito?: number | string;
  className?: string;
  isLoading?: boolean;
  showAsRatings?: boolean;
  // Props para IDs de usuarios y clave del KPI
  accessUserIds?: string[];
  kpiKey?: string;
}

interface LoadingElementProps {
  className: string;
  width?: number | string;
}

interface UserCircleProps {
  nombre: string;
}

// Función para detectar pulsación larga
function useLongPress(callback = () => {}, ms = 500) {
  const [startLongPress, setStartLongPress] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  useEffect(() => {
    let timerId;
    if (startLongPress && !longPressTriggered) {
      timerId = setTimeout(() => {
        callback();
        setLongPressTriggered(true);
      }, ms);
    } else {
      clearTimeout(timerId);
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [startLongPress, callback, ms, longPressTriggered]);

  const start = () => {
    setStartLongPress(true);
    setLongPressTriggered(false);
  };

  const stop = () => {
    setStartLongPress(false);
    setLongPressTriggered(false);
  };

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}

// Componente para mostrar una inicial del usuario en un círculo
const UserCircle: React.FC<UserCircleProps> = ({ nombre }) => {
  const inicial = nombre ? nombre.charAt(0).toUpperCase() : "?";

  return (
    <div
      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium bg-gray-200 text-black"
      title={nombre}
    >
      {inicial}
    </div>
  );
};

const LoadingElement: React.FC<LoadingElementProps> = ({
  className,
  width,
}) => (
  <div
    className={`bg-gray-200 rounded overflow-hidden ${className}`}
    style={{ width }}
  >
    <motion.div
      className="h-full w-full bg-gradient-to-r from-gray-200 via-white to-gray-200"
      animate={{ x: ["100%", "-100%"] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
    />
  </div>
);

export const CardInfo: React.FC<CardInfoProps> = ({
  info,
  title,
  link,
  cuadrito,
  className = "",
  isLoading = false,
  showAsRatings = false,
  accessUserIds = [],
  kpiKey = "",
}) => {
  const titleRef = useRef<HTMLParagraphElement>(null);
  const infoRef = useRef<HTMLParagraphElement>(null);
  const [titleWidth, setTitleWidth] = useState<number | undefined>(undefined);
  const [infoWidth, setInfoWidth] = useState<number | undefined>(undefined);
  const [isMarketingUser, setIsMarketingUser] = useState(false);
  const [accessUsers, setAccessUsers] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Obtener empleados y empresa para mostrar nombres de usuarios con acceso
  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;
  const empresaId =
    tipoUsuario === "empresa"
      ? (auth?.usuario as EmpresaProps)?.id
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.empresaId
        : "";

  // Obtener información de todos los empleados
  const [allEmpleados, setAllEmpleados] = useState<EmpleadoProps[]>([]);

  // Verificar si el usuario actual es empresario (administrador)
  const isEmpresario = tipoUsuario === "empresa";

  // Configurar el detector de pulsación larga
  const longPressEvent = useLongPress(() => {
    // Solo permitir configurar acceso si es empresario
    if (isEmpresario && kpiKey) {
      setShowAccessModal(true);
    }
  }, 800);

  useEffect(() => {
    const getEmpleadosInfo = async () => {
      if (!empresaId) return;

      try {
        // Obtener empleados de la empresa desde Firestore
        const fetchEmpleados = async () => {
          // Importa la función de ClientesAbsolute
          const { obtenerEmpleadosDeEmpresa } = await import(
            "../../firebase/ClientesAbsolute"
          );
          return await obtenerEmpleadosDeEmpresa(empresaId);
        };

        const empleados = await fetchEmpleados();
        setAllEmpleados(empleados);
      } catch (error) {
        console.error("Error al obtener empleados:", error);
        setAllEmpleados([]);
      }
    };

    getEmpleadosInfo();
  }, [empresaId]);

  // Procesar los IDs de usuario para obtener nombres
  useEffect(() => {
    // Función para cargar y mostrar todos los usuarios con acceso
    const loadAccessUsers = async () => {
      if (!accessUserIds || accessUserIds.length === 0 || !empresaId) return;

      try {
        // Importar funciones necesarias
        const { obtenerEmpleadosDeEmpresa, obtenerEmpresaPorId } = await import(
          "../../firebase/ClientesAbsolute"
        );

        // Obtener todos los empleados de la empresa
        const todosEmpleados = await obtenerEmpleadosDeEmpresa(empresaId);

        // Obtener datos de la empresa
        const empresaData = await obtenerEmpresaPorId(empresaId);

        // Array para almacenar usuarios con acceso
        const usuariosConAcceso = [];

        // Procesar cada ID de acceso
        for (const userId of accessUserIds) {
          // Caso 1: El ID es de un empleado
          const empleado = todosEmpleados.find((emp) => emp.id === userId);
          if (empleado) {
            usuariosConAcceso.push({
              id: empleado.id,
              nombre: empleado.datos?.nombre || "Empleado",
            });
            continue;
          }

          // Caso 2: El ID corresponde al empresario/dueño
          if (empresaData && empresaData.id === userId) {
            usuariosConAcceso.push({
              id: empresaData.id,
              nombre: empresaData.datosUsuario?.nombreUsuario || "Dueño",
            });
          }
        }

        // Actualizar el estado
        setAccessUsers(usuariosConAcceso);
      } catch (error) {
        console.error("Error al cargar usuarios con acceso:", error);
      }
    };

    // Ejecutar la función
    loadAccessUsers();
  }, [accessUserIds, empresaId]);

  useEffect(() => {
    // Verificar si el usuario es de marketing
    const currentUserEmail = projectAuth.currentUser?.email;
    setIsMarketingUser(currentUserEmail === "marketing@anhelo.com");
  }, []);

  useEffect(() => {
    if (titleRef.current) {
      setTitleWidth(titleRef.current.offsetWidth);
    }
    if (infoRef.current) {
      setInfoWidth(infoRef.current.offsetWidth);
    }
  }, [info, title, cuadrito]);

  const shouldShowAdditionalInfo = (): boolean => {
    if (cuadrito === undefined) return false;
    if (typeof cuadrito === "number") return cuadrito > 0;
    if (typeof cuadrito === "string") {
      const numValue = parseFloat(cuadrito);
      return !isNaN(numValue) && numValue > 0;
    }
    return false;
  };

  const formatAdditionalInfo = () => {
    if (!shouldShowAdditionalInfo()) return "";

    const value =
      typeof cuadrito === "number"
        ? Math.ceil(cuadrito)
        : Math.ceil(parseFloat(cuadrito as string));
    return showAsRatings ? `(${value} ratings)` : `(${value}%)`;
  };

  // Manejar la actualización de acceso desde el modal
  const handleUpdateAccess = async (newAccessIds: string[]) => {
    if (!empresaId || !kpiKey) return;

    try {
      // Importar funciones necesarias
      const { updateKpiConfig } = await import(
        "../../firebase/ClientesAbsolute"
      );

      // Obtener la configuración actual
      const { getKpiConfig } = await import("../../firebase/ClientesAbsolute");
      const currentConfig = await getKpiConfig(empresaId);

      // Actualizar la configuración con los nuevos IDs
      const updatedConfig = {
        ...currentConfig,
        [kpiKey]: newAccessIds,
      };

      // Guardar la configuración actualizada en Firestore
      await updateKpiConfig(empresaId, updatedConfig);

      // Volver a cargar los usuarios con acceso para reflejar los cambios
      const { obtenerEmpleadosDeEmpresa, obtenerEmpresaPorId } = await import(
        "../../firebase/ClientesAbsolute"
      );

      const todosEmpleados = await obtenerEmpleadosDeEmpresa(empresaId);
      const empresaData = await obtenerEmpresaPorId(empresaId);

      const newAccessUsers = [];

      for (const userId of newAccessIds) {
        const empleado = todosEmpleados.find((emp) => emp.id === userId);
        if (empleado) {
          newAccessUsers.push({
            id: empleado.id,
            nombre: empleado.datos?.nombre || "Empleado",
          });
          continue;
        }

        if (empresaData && empresaData.id === userId) {
          newAccessUsers.push({
            id: empresaData.id,
            nombre: empresaData.datosUsuario?.nombreUsuario || "Dueño",
          });
        }
      }

      setAccessUsers(newAccessUsers);
    } catch (error) {
      console.error("Error al actualizar permisos de KPI:", error);
      alert("Error al guardar los cambios. Intente nuevamente.");
    }
  };

  const CardContent = () => (
    <div
      className="flex flex-row justify-between items-center w-full"
      {...(isEmpresario && kpiKey ? longPressEvent : {})}
    >
      {/* letras */}
      <div className="flex flex-col ">
        <div className="flex flex-col ">
          {/* Círculos de usuarios con acceso */}
          {!isLoading && accessUsers.length > 0 && (
            <div className="flex flex-row gap-1">
              {accessUsers.slice(0, 6).map((usuario, index) => (
                <UserCircle key={usuario.id} nombre={usuario.nombre} />
              ))}
              {accessUsers.length > 6 && (
                <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-xs text-gray-100 font-medium">
                  +{accessUsers.length - 6}
                </div>
              )}
            </div>
          )}
          {isLoading ? (
            <LoadingElement className="h-4" width={titleWidth} />
          ) : (
            <p ref={titleRef} className="text-sm font-medium">
              {title}
              {shouldShowAdditionalInfo() && ` ${formatAdditionalInfo()}`}
            </p>
          )}
          {!isMarketingUser &&
            link &&
            (isLoading ? (
              <LoadingElement className="h-2 w-1.5" />
            ) : (
              <img src={arrow} className="h-2 w-1.5" alt="" />
            ))}
        </div>
      </div>

      {/* numero */}
      <div>
        {isLoading ? (
          <LoadingElement className="h-8" width={infoWidth} />
        ) : (
          <p ref={infoRef} className="text-4xl font-medium">
            {info}
          </p>
        )}
      </div>
    </div>
  );

  // Si es usuario de marketing o no hay link, renderizar un div
  if (isMarketingUser || !link) {
    return (
      <div
        className={`flex-1 bg-gray-100 text-black font-coolvetica border-b    border-gray-200   border-b  px-4 pt-2 pb-3 cursor-default ${className} relative`}
      >
        <CardContent />

        {/* Modal de configuración de acceso */}
        {kpiKey && (
          <KpiAccessModal
            key={`modal-${kpiKey}-${showAccessModal ? "open" : "closed"}`}
            kpiKey={kpiKey}
            kpiTitle={title}
            isOpen={showAccessModal}
            onClose={() => setShowAccessModal(false)}
            currentAccessIds={accessUserIds}
            onUpdate={handleUpdateAccess}
          />
        )}
      </div>
    );
  }

  // Si no es usuario de marketing y hay link, renderizar NavLink
  return (
    <NavLink
      to={`/${link}`}
      className={`flex-1 bg-gray-100 text-black font-coolvetica border-b    border-gray-200   border-b  px-4 pt-2 pb-3 ${className} relative`}
      onClick={(e) => {
        // Evitar navegación si se está usando longpress
        if (showAccessModal) {
          e.preventDefault();
        }
      }}
    >
      <CardContent />

      {/* Modal de configuración de acceso */}
      {kpiKey && (
        <KpiAccessModal
          key={`modal-${kpiKey}-${showAccessModal ? "open" : "closed"}`}
          kpiKey={kpiKey}
          kpiTitle={title}
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          currentAccessIds={accessUserIds}
          onUpdate={handleUpdateAccess}
        />
      )}
    </NavLink>
  );
};

export default CardInfo;
