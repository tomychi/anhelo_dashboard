import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { logoutSuccess } from "../../redux/auth/authAction";
import Absolute from "../../assets/absoluteIsologo.avif";
import { ReadDataForDateRange } from "../../firebase/ReadData";
import { PedidoProps } from "../../types/types";
import {
  obtenerNombreEmpresa,
  EmpresaProps,
  EmpleadoProps,
  obtenerEmpresaPorId,
  anadirFuncionalidadesEmpresa,
} from "../../firebase/ClientesAbsolute";
// Importar las utilidades de permisos
import {
  featureToRouteMap,
  permissionToDisplayName,
  getUserPermissions,
} from "../../utils/permissionsUtils";
import MoreFeaturesModal from "./MoreFeaturesModal";
import { updateEmpresa } from "../../redux/auth/authAction";

interface MenuItem {
  to: string;
  text: string;
}

export const Sidebar = ({ scrollContainerRef }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isFeatureLoading, setIsFeatureLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [menuTranslate, setMenuTranslate] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [menuDragStart, setMenuDragStart] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [empleadoPermisos, setEmpleadoPermisos] = useState<string[]>([]);
  const [hasReclamos, setHasReclamos] = useState(false);
  const [reclamosCount, setReclamosCount] = useState(0);
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [noPermissions, setNoPermissions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const menuModalRef = useRef<HTMLDivElement>(null);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [rolUsuario, setRolUsuario] = useState("");
  const [nombreEmpresaDirecto, setNombreEmpresaDirecto] = useState("");
  const [featuresIniciales, setFeaturesIniciales] = useState<string[]>([]);

  const handleAddFeatures = async (nuevasFuncionalidades) => {
    if (!empresaId || nuevasFuncionalidades.length === 0) return;

    setIsFeatureLoading(true);

    try {
      await anadirFuncionalidadesEmpresa(empresaId, nuevasFuncionalidades);

      // Actualizar el estado local y global
      const empresaActualizada = await obtenerEmpresaPorId(empresaId);

      if (empresaActualizada) {
        // Actualizar Redux
        dispatch(updateEmpresa(empresaActualizada));

        // Actualizar estado local
        setFeaturesIniciales(empresaActualizada.featuresIniciales || []);
      }

      setIsFeatureModalOpen(false);

      // Mostrar notificación de éxito
      alert("Funcionalidades añadidas correctamente");
    } catch (error) {
      console.error("Error al añadir funcionalidades:", error);
      alert(
        "Ocurrió un error al añadir las funcionalidades. Intenta nuevamente."
      );
    } finally {
      setIsFeatureLoading(false);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;

    if (!scrollContainer) return;

    const handleScroll = () => {
      if (scrollContainer.scrollTop > 72) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  const auth = useSelector((state: RootState) => state.auth);
  const isAuth = auth?.isAuth || false;
  const tipoUsuario = auth?.tipoUsuario;
  const empresaId =
    tipoUsuario === "empresa"
      ? (auth.usuario as EmpresaProps)?.id
      : tipoUsuario === "empleado"
        ? (auth.usuario as EmpleadoProps)?.empresaId
        : undefined;

  // Obtener la información según el tipo de usuario
  useEffect(() => {
    if (tipoUsuario === "empresa" && auth?.usuario) {
      setNombreUsuario(
        (auth.usuario as EmpresaProps).datosUsuario?.nombreUsuario || ""
      );
      setRolUsuario(
        (auth.usuario as EmpresaProps).datosUsuario?.rolUsuario || ""
      );
      setNombreEmpresaDirecto(
        (auth.usuario as EmpresaProps).datosGenerales?.nombre || ""
      );
      setFeaturesIniciales(
        (auth.usuario as EmpresaProps).featuresIniciales || []
      );
      // Resetear permisos de empleado
      setEmpleadoPermisos([]);
    } else if (tipoUsuario === "empleado" && auth?.usuario) {
      setNombreUsuario((auth.usuario as EmpleadoProps).datos?.nombre || "");
      setRolUsuario((auth.usuario as EmpleadoProps).datos?.rol || "");
      // Guardar los permisos del empleado
      setEmpleadoPermisos(
        (auth.usuario as EmpleadoProps).datos?.permisos || []
      );
      // Resetear featuresIniciales
      setFeaturesIniciales([]);
    }
  }, [tipoUsuario, auth?.usuario]);

  // Nombre de empresa a mostrar
  const displayEmpresa =
    tipoUsuario === "empresa"
      ? nombreEmpresaDirecto || "Sin nombre"
      : tipoUsuario === "empleado"
        ? empresaNombre || "Sin nombre"
        : "Sin nombre";

  // Obtener el nombre de la empresa para empleados
  useEffect(() => {
    const cargarNombreEmpresa = async () => {
      if (tipoUsuario === "empleado" && auth?.usuario) {
        const id = (auth.usuario as EmpleadoProps).empresaId;
        if (id) {
          try {
            const nombre = await obtenerNombreEmpresa(id);
            setEmpresaNombre(nombre);
          } catch (error) {
            console.error("Error al obtener nombre de empresa:", error);
          }
        }
      }
    };

    cargarNombreEmpresa();
  }, [tipoUsuario, auth?.usuario]);

  useEffect(() => {
    const fetchPedidosConReclamo = async () => {
      // Solo fetch reclamos si el usuario está autenticado
      if (!isAuth) return;
      try {
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const dateRange = {
          startDate: threeDaysAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };

        const pedidos = await ReadDataForDateRange<PedidoProps>(
          "pedidos",
          dateRange
        );
        const pedidosConReclamoNoResuelto = pedidos.filter(
          (order) => "reclamo" in order && order.reclamo?.resuelto === false
        );

        // Actualizamos el estado con la cantidad de reclamos no resueltos
        setHasReclamos(pedidosConReclamoNoResuelto.length > 0);
        setReclamosCount(pedidosConReclamoNoResuelto.length);

        if (pedidosConReclamoNoResuelto.length > 0) {
          console.log(
            "Pedidos con reclamo NO resuelto de los últimos 3 días desde Sidebar:",
            pedidosConReclamoNoResuelto.map((order) => ({
              id: order.id,
              fecha: order.fecha,
              hora: order.hora,
              total: order.total,
              reclamo: {
                alias: order.reclamo?.alias,
                descripcion: order.reclamo?.descripcion,
                fecha: order.reclamo?.fecha,
                resuelto: order.reclamo?.resuelto,
                gift: order.reclamo?.gift || [],
              },
            }))
          );
        }
      } catch (error) {
        console.error("Error al obtener pedidos con reclamo:", error);
        setHasReclamos(false);
        setReclamosCount(0);
      }
    };

    fetchPedidosConReclamo();
  }, [isAuth]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Build menu items from featuresIniciales
  useEffect(() => {
    if (tipoUsuario === "empresa" && featuresIniciales.length > 0) {
      // Para empresas, usar featuresIniciales
      const items: MenuItem[] = featuresIniciales.map((feature) => {
        // Usamos la primera ruta del array como la ruta principal para el menú
        const routes = featureToRouteMap[feature] || [];
        const mainRoute =
          routes.length > 0
            ? routes[0]
            : `/${feature.toLowerCase().replace(/\s+/g, "")}`;

        return {
          to: mainRoute,
          text: feature,
        };
      });

      // Build menu items based on user type
      items.push({ to: "/settings", text: "Configuración" });

      setMenuItems(items);
      setNoPermissions(false);
    } else if (tipoUsuario === "empleado" && empleadoPermisos.length > 0) {
      // Para empleados, usar sus permisos específicos
      const items: MenuItem[] = empleadoPermisos.map((permiso) => {
        // Usamos la primera ruta del array como la ruta principal para el menú
        const routes = featureToRouteMap[permiso] || [];
        const mainRoute =
          routes.length > 0
            ? routes[0]
            : `/${permiso.toLowerCase().replace(/\s+/g, "")}`;

        return {
          to: mainRoute,
          text: permissionToDisplayName[permiso] || permiso, // Usar nombre legible
        };
      });

      setMenuItems(items);
      setNoPermissions(false);
    } else if (isAuth) {
      // El usuario está autenticado pero no tiene permisos
      setMenuItems([]);
      setNoPermissions(true);
    } else {
      // Usuario no autenticado - no establecemos noPermissions
      setMenuItems([]);
      setNoPermissions(false);
    }
  }, [featuresIniciales, empleadoPermisos, tipoUsuario, isAuth]);

  const handleLogout = () => {
    try {
      dispatch(logoutSuccess());
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsProfileOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart(e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null) return;
    const currentPosition = e.touches[0].clientY;
    const difference = currentPosition - dragStart;
    if (difference > 0) return;
    setCurrentTranslate(Math.abs(difference));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart === null) return;
    const difference = e.clientY - dragStart;
    if (difference > 0) return;
    setCurrentTranslate(Math.abs(difference));
  };

  const handleDragEnd = () => {
    if (currentTranslate > 200) {
      setIsProfileOpen(false);
    }
    setCurrentTranslate(0);
    setDragStart(null);
  };

  const handleMenuTouchStart = (e: React.TouchEvent) => {
    setMenuDragStart(e.touches[0].clientY);
  };

  const handleMenuMouseDown = (e: React.MouseEvent) => {
    setMenuDragStart(e.clientY);
  };

  const handleMenuTouchMove = (e: React.TouchEvent) => {
    if (menuDragStart === null) return;
    const currentPosition = e.touches[0].clientY;
    const difference = currentPosition - menuDragStart;
    if (difference > 0) return;
    setMenuTranslate(Math.abs(difference));
  };

  const handleMenuMouseMove = (e: React.MouseEvent) => {
    if (menuDragStart === null) return;
    const difference = e.clientY - menuDragStart;
    if (difference > 0) return;
    setMenuTranslate(Math.abs(difference));
  };

  const handleMenuDragEnd = () => {
    if (menuTranslate > 200) {
      setIsMenuOpen(false);
    }
    setMenuTranslate(0);
    setMenuDragStart(null);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragStart !== null) {
        handleDragEnd();
      }
      if (menuDragStart !== null) {
        handleMenuDragEnd();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleDragEnd);
    window.addEventListener("touchend", handleMenuDragEnd);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleDragEnd);
      window.removeEventListener("touchend", handleMenuDragEnd);
    };
  }, [dragStart, currentTranslate, menuDragStart, menuTranslate]);

  const toggleMenu = () => {
    if (isProfileOpen) {
      setIsProfileOpen(false);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    setIsProfileOpen(!isProfileOpen);
  };

  const renderMenuItems = () => {
    if (!isAuth) {
      // Si no está autenticado, mostrar todos los features con candado
      const defaultFeatures = [
        { to: "/dashboard", text: "Dashboard" },
        { to: "/comanderaAutomatizada", text: "Operaciones" },
        { to: "/gastos", text: "Gastos" },
        { to: "/deudaManager", text: "Deuda" },
        { to: "/vouchers", text: "Campañas de marketing" },
        { to: "/facturacion", text: "Facturación" },
        { to: "/clientes", text: "Comportamiento de clientes" },
        { to: "/settings", text: "Configuración" },
      ];

      return defaultFeatures.map((item, index) => (
        <li key={index}>
          <NavLink
            to="#"
            className="block text-2xl font-coolvetica font-bold flex items-center text-gray-400"
            onClick={(e) => e.preventDefault()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mr-2 w-6 h-6 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                clipRule="evenodd"
              />
            </svg>
            {item.text}
          </NavLink>
        </li>
      ));
    } else if (noPermissions) {
      // Si está autenticado pero no tiene permisos, mostrar mensaje
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-16 h-16 text-gray-400 mb-4"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-xl font-bold mb-2">
            Aún no tienes permisos asignados
          </h3>
          <p className="text-sm text-gray-500">
            Contacta con el administrador para solicitar acceso a las
            funcionalidades del sistema.
          </p>
        </div>
      );
    }

    // Si está autenticado y tiene permisos, mostrar sus menús
    return menuItems.map((item, index) => (
      <li key={index}>
        <NavLink
          to={item.to}
          className="block text-2xl font-coolvetica font-bold flex items-center"
          onClick={() => setIsMenuOpen(false)}
        >
          {item.text}
        </NavLink>
      </li>
    ));
  };

  const profileMenuItems = [
    {
      to: "/perfil",
      text: "Mi perfil",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4"
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      to: "/notificaciones",
      text: hasReclamos
        ? `Notificaciones (${reclamosCount})`
        : "Notificaciones", // Mostrar conteo si hay reclamos
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4"
        >
          <path
            fillRule="evenodd"
            d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      to: "/preferencias",
      text: "Preferencias",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4"
        >
          <path
            fillRule="evenodd"
            d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

  const renderDesktopProfile = () => (
    <div className="absolute right-0 mt-2 w-96 font-coolvetica bg-gray-100 rounded-lg shadow-lg overflow-hidden">
      {/* Profile Header */}
      <div className="border-b border-gray-200">
        <div className="px-4 pb-8 flex justify-center flex-col items-center pt-6">
          <div className="text-3xl font-bold">{nombreUsuario || "NaN"}</div>
          <div className="text-xs text-gray-400 ">
            {(rolUsuario || "NaN").toLowerCase().charAt(0).toUpperCase() +
              (rolUsuario || "NaN").toLowerCase().slice(1)}{" "}
            en{" "}
            {displayEmpresa.toLowerCase().charAt(0).toUpperCase() +
              displayEmpresa.toLowerCase().slice(1)}
          </div>
        </div>

        {/* Principales acciones */}
        <div className="grid grid-cols-3 font-bold gap-2 px-4 pb-4">
          <NavLink to="/ayuda" className="flex flex-col items-center">
            <div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs mt-1">Ayuda</span>
            </div>
          </NavLink>
          <NavLink to="/billetera" className="flex flex-col items-center">
            <div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8"
              >
                <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                <path
                  fillRule="evenodd"
                  d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs mt-1">Billetera</span>
            </div>
          </NavLink>
          <NavLink to="/actividad" className="flex flex-col items-center">
            <div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
                <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
              </svg>
              <span className="text-xs mt-1">Actividad</span>
            </div>
          </NavLink>
        </div>
      </div>
      <div className="mt-4">
        {profileMenuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.to}
            className="px-4 h-10 flex items-center text-xs hover:bg-gray-200"
          >
            <span className="mr-2">{item.icon}</span>
            {item.text}
          </NavLink>
        ))}
      </div>
      <div className="mr-8">
        <button
          onClick={handleLogout}
          className="w-full text-xl text-red-main h-20 mt-4 font-bold ml-4 rounded-lg text-center mb-4 bg-gray-200"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  const renderMobileProfile = () => (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div
        className="absolute inset-0 bg-black backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: Math.max(0, 1 - currentTranslate / 400),
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
        onClick={() => setIsProfileOpen(false)}
      />
      <div
        ref={modalRef}
        className="relative bg-gray-100 w-full rounded-b-lg pt-10 transition-transform duration-300 touch-none"
        style={{
          transform: `translateY(${-currentTranslate}px)`,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        </div>
        <div className="px-4 pb-4 flex justify-center flex-col items-center">
          <div className="text-3xl font-bold">
            {(nombreUsuario || "NaN")
              .split(" ")
              .map(
                (palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1)
              )
              .join(" ")}
          </div>
          <div className="text-xs text-gray-400 ">
            {(rolUsuario || "NaN").toLowerCase().charAt(0).toUpperCase() +
              (rolUsuario || "NaN").toLowerCase().slice(1)}{" "}
            en{" "}
            {displayEmpresa.toLowerCase().charAt(0).toUpperCase() +
              displayEmpresa.toLowerCase().slice(1)}
          </div>
        </div>
        <div className="grid grid-cols-3 font-bold gap-2 px-4 pb-4 ">
          <NavLink to="/ayuda" className="flex flex-col items-center">
            <div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0 2.25a1.125 1.125 0 0 0 0-2.25ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs mt-1">Ayuda</span>
            </div>
          </NavLink>
          <NavLink to="/billetera" className="flex flex-col items-center">
            <div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8"
              >
                <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                <path
                  fillRule="evenodd"
                  d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs mt-1">Billetera</span>
            </div>
          </NavLink>
          <NavLink to="/actividad" className="flex flex-col items-center">
            <div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
                <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
              </svg>
              <span className="text-xs mt-1">Actividad</span>
            </div>
          </NavLink>
        </div>
        <div className="flex flex-col pt-4">
          {profileMenuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.to}
              className="flex items-center px-4 h-10"
              onClick={() => setIsProfileOpen(false)}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="text-sm font-medium">{item.text}</span>
            </NavLink>
          ))}
        </div>
        <div className="mx-4">
          <button
            onClick={handleLogout}
            className="w-full font-coolvetica text-red-main h-20 mb-12 mt-4 font-bold rounded-lg text-xl text-center bg-gray-200"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );

  const inicialUsuario = nombreUsuario
    ? nombreUsuario.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 flex font-coolvetica flex-row w-full pt-4 pb-4 gap-2 justify-between px-4 z-30 transition-all duration-300 ${
          isScrolled ? "bg-black bg-opacity-75 backdrop-blur-md" : "bg-black"
        }`}
      >
        {!isAuth ? (
          <NavLink to={"/"} className="ml-[-3px] items-center">
            <img
              src={Absolute}
              className="h-10 filter brightness-[400] saturate-0"
              alt="Absolute Logo"
            />
          </NavLink>
        ) : (
          <NavLink to={"/dashboard"} className="ml-[-3px] items-center">
            <img
              src={Absolute}
              className="h-10 filter brightness-[400] saturate-0"
              alt="Absolute Logo"
            />
          </NavLink>
        )}

        <div className="flex flex-row items-center">
          <button
            onClick={toggleMenu}
            className="flex items-center h-10 w-10 justify-center"
          >
            <div className="hover:bg-white hover:bg-opacity-10 text-gray-100 h-10 w-10 flex items-center justify-center rounded-full focus:outline-none transition duration-300 ease-in-out">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="currentColor"
                className="w-6 text-gray-100"
              >
                <path d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
            </div>
          </button>
          {!isAuth ? (
            <div
              className="bg-gray-100 ml-2 rounded-full px-4 h-10 items-center flex cursor-pointer"
              onClick={() => navigate("/authentication")}
            >
              Iniciar sesion
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={toggleProfile}
                className="relative bg-gray-100 h-9 w-9 rounded-full justify-center items-center flex font-coolvetica font-bold focus:outline-none transition duration-300 ease-in-out hover:bg-gray-200 ml-2 cursor-pointer"
              >
                {inicialUsuario}

                {hasReclamos && (
                  <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
              {isProfileOpen &&
                (isMobile ? renderMobileProfile() : renderDesktopProfile())}
            </div>
          )}
        </div>
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300"
            style={{
              opacity: Math.max(0, 1 - menuTranslate / 400),
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            ref={menuModalRef}
            className="relative bg-gray-100 rounded-b-lg w-full pb-7 transition-transform duration-300 touch-none pt-8"
            style={{
              transform: `translateY(${-menuTranslate}px)`,
              overflowY: "auto",
            }}
          >
            {isMobile && (
              <div
                className="absolute bottom-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing"
                onTouchStart={handleMenuTouchStart}
                onTouchMove={handleMenuTouchMove}
                onMouseDown={handleMenuMouseDown}
                onMouseMove={handleMenuMouseMove}
              >
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>
              </div>
            )}
            <nav className="px-4 h-full overflow-y-auto">
              <ul className="flex flex-col gap-4">{renderMenuItems()}</ul>
              <div
                className="w-full h-20 text-gray-100 text-center items-center flex justify-center bg-indigo-500 font-bold font-coolvetica text-2xl mt-12 rounded-3xl cursor-pointer"
                onClick={() => {
                  if (isAuth) {
                    setIsFeatureModalOpen(true);
                  } else {
                    setIsMenuOpen(false); // Cerrar el menú antes de navegar
                    navigate("/crearEmpresa");
                  }
                }}
              >
                {isAuth ? "Más funcionalidades" : "Prueba gratuita"}
              </div>

              <p className="font-medium text-xs opacity-30 font-coolvetica text-center  mt-4">
                Ⓡ 2023. Absolute, Soluciones Empresariales.
              </p>
            </nav>
            {isFeatureModalOpen && (
              <MoreFeaturesModal
                isOpen={isFeatureModalOpen}
                onClose={() => setIsFeatureModalOpen(false)}
                currentFeatures={featuresIniciales}
                onAddFeatures={handleAddFeatures}
                loading={isFeatureLoading}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
