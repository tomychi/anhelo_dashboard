import React, { useRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { projectAuth } from "../../firebase/config";
import arrow from "../../assets/arrowIcon.png";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { EmpleadoProps, EmpresaProps } from "../../firebase/ClientesAbsolute";

interface CardInfoProps {
  info: string | number;
  title: string;
  link?: string;
  cuadrito?: number | string;
  className?: string;
  isLoading?: boolean;
  showAsRatings?: boolean;
  // Nuevo prop para recibir IDs de usuarios con acceso
  accessUserIds?: string[];
}

interface LoadingElementProps {
  className: string;
  width?: number | string;
}

interface UserCircleProps {
  nombre: string;
  color?: string;
}

// Componente para mostrar una inicial del usuario en un círculo
const UserCircle: React.FC<UserCircleProps> = ({
  nombre,
  color = "#6366F1",
}) => {
  const inicial = nombre ? nombre.charAt(0).toUpperCase() : "?";

  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
      style={{ backgroundColor: color }}
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
}) => {
  const titleRef = useRef<HTMLParagraphElement>(null);
  const infoRef = useRef<HTMLParagraphElement>(null);
  const [titleWidth, setTitleWidth] = useState<number | undefined>(undefined);
  const [infoWidth, setInfoWidth] = useState<number | undefined>(undefined);
  const [isMarketingUser, setIsMarketingUser] = useState(false);
  const [accessUsers, setAccessUsers] = useState<
    { id: string; nombre: string }[]
  >([]);

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
    if (!accessUserIds.length) return;

    // Filtrar empleados que tienen acceso a este KPI
    const empleadosConAcceso = allEmpleados
      .filter((emp) => accessUserIds.includes(emp.id))
      .map((emp) => ({
        id: emp.id,
        nombre: emp.datos?.nombre || "Usuario",
      }));

    // Verificar si el empresario está en la lista
    if (
      auth?.usuario?.id &&
      accessUserIds.includes(auth.usuario.id) &&
      tipoUsuario === "empresa"
    ) {
      empleadosConAcceso.push({
        id: auth.usuario.id,
        nombre:
          (auth.usuario as EmpresaProps)?.datosUsuario?.nombreUsuario ||
          "Dueño",
      });
    }

    setAccessUsers(empleadosConAcceso);
  }, [accessUserIds, allEmpleados, auth?.usuario?.id, tipoUsuario]);

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

  // Colores predefinidos para los círculos de usuarios
  const userColors = [
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#3B82F6", // Blue
  ];

  // Generar color basado en el ID del usuario (para que sea consistente)
  const getUserColor = (userId: string): string => {
    const index =
      userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      userColors.length;
    return userColors[index];
  };

  const CardContent = () => (
    <div className="flex flex-col w-full">
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-col gap-1">
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
        {isLoading ? (
          <LoadingElement className="h-8" width={infoWidth} />
        ) : (
          <p ref={infoRef} className="text-4xl font-medium">
            {info}
          </p>
        )}
      </div>

      {/* Círculos de usuarios con acceso */}
      {!isLoading && accessUsers.length > 0 && (
        <div className="flex flex-row mt-2 space-x-1">
          {accessUsers.slice(0, 6).map((usuario, index) => (
            <UserCircle
              key={usuario.id}
              nombre={usuario.nombre}
              color={getUserColor(usuario.id)}
            />
          ))}
          {accessUsers.length > 6 && (
            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 font-medium">
              +{accessUsers.length - 6}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Si es usuario de marketing o no hay link, renderizar un div
  if (isMarketingUser || !link) {
    return (
      <div
        className={`flex-1 bg-gray-100 text-black font-coolvetica border-[0.5px] border-opacity-10 border-black px-4 pt-2 pb-3 cursor-default ${className}`}
      >
        <CardContent />
      </div>
    );
  }

  // Si no es usuario de marketing y hay link, renderizar NavLink
  return (
    <NavLink
      to={`/${link}`}
      className={`flex-1 bg-gray-100 text-black font-coolvetica border-[0.5px] border-opacity-10 border-black px-4 pt-2 pb-3 ${className}`}
    >
      <CardContent />
    </NavLink>
  );
};

export default CardInfo;
