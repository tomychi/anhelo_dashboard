// utils/permissionsUtils.ts

import { EmpresaProps, EmpleadoProps } from "../firebase/ClientesAbsolute";

// Definición de tipos
export interface PermissionMappings {
  [key: string]: string;
}

export interface RoutePermissions {
  [key: string]: string[];
}

export interface DisplayNames {
  [key: string]: string;
}

export const PERMISOS_SISTEMA = [
  "Dashboard",
  "Ventas",
  "Gastos",
  "Facturación automática",
  "Operaciones",
  "Empleados",
  "Inversores",
  "Finanzas",
  "Página de ventas",
  "Precios dinámicos",
  "WhatsApp Marketing",
  "Deuda",
  "Comportamiento de clientes",
];

// Mapeo de características/permisos a rutas (para el Sidebar)
export const featureToRouteMap: PermissionMappings = {
  Dashboard: "/dashboard",
  "Facturación automática": "/facturacion",
  Operaciones: "/comanderaAutomatizada",
  Empleados: "/empleados",
  Inversores: "/inversores",
  Finanzas: "/finanzas",
  "Página de ventas": "/ventas",
  "Precios dinámicos": "/precios",
  "WhatsApp Marketing": "/vouchers",
  Gastos: "/gastos",
  Deuda: "/deudaManager",
  "Comportamiento de clientes": "/clientes",
  Ventas: "/ventas",
};

// Mapeo de permisos a rutas permitidas
export const permissionToRoutesMap: Record<string, string[]> = {
  Dashboard: ["/dashboard", "/monthdata"],
  Ventas: ["/ventas", "/comanderaAutomatizada", "/productosVendidos"],
  Gastos: ["/gastos", "/nuevaCompra"],
  "Facturación automática": ["/facturacion"],
  Operaciones: ["/comanderaAutomatizada", "/pedidos"],
  Empleados: ["/empleados", "/equipo", "/registroHorario"],
  Inversores: ["/inversores"],
  Finanzas: ["/finanzas", "/neto", "/bruto"],
  "WhatsApp Marketing": ["/vouchers", "/whatsappFeatures", "/campañaDetalle"],
  Deuda: ["/deudaManager"],
  "Comportamiento de clientes": ["/clientes", "/seguidores"],
};

// Mapeo de rutas especiales que requieren un tipo de usuario específico
export const routeToUserTypeMap: Record<string, string[]> = {
  "/settings": ["empresa"],
};

// Obtener permisos de un usuario según su tipo
export const getUserPermissions = (auth: any): string[] => {
  const tipoUsuario = auth?.tipoUsuario;

  if (tipoUsuario === "empresa") {
    // Las empresas tienen acceso a todo lo que está en featuresIniciales
    return (auth?.usuario as EmpresaProps)?.featuresIniciales || [];
  } else if (tipoUsuario === "empleado") {
    // Los empleados tienen permisos específicos
    return (auth?.usuario as EmpleadoProps)?.datos?.permisos || [];
  }

  return [];
};

// Verificar si un usuario tiene permiso para acceder a una ruta específica
export const hasPermissionForRoute = (
  currentPath: string,
  userPermissions: string[],
  tipoUsuario: string | undefined
): boolean => {
  // Rutas públicas que siempre son accesibles
  const publicRoutes = [
    "/",
    "/authentication",
    "/crearEmpresa",
    "/perfil",
    "/notificaciones",
    "/preferencias",
    "/ayuda",
    "/billetera",
    "/actividad",
  ];

  // Si es una ruta pública, permitir acceso
  for (const route of publicRoutes) {
    if (currentPath === route || currentPath.startsWith(`${route}/`)) {
      return true;
    }
  }

  // Verificar acceso a rutas que requieren un tipo de usuario específico
  for (const [route, allowedTypes] of Object.entries(routeToUserTypeMap)) {
    if (currentPath === route || currentPath.startsWith(`${route}/`)) {
      return !!tipoUsuario && allowedTypes.includes(tipoUsuario);
    }
  }

  // Obtener todas las rutas permitidas para los permisos del usuario
  const permittedRoutes: string[] = userPermissions.flatMap(
    (permission) => permissionToRoutesMap[permission] || []
  );

  // Verificar si la ruta actual está permitida
  for (const route of permittedRoutes) {
    if (currentPath === route || currentPath.startsWith(`${route}/`)) {
      return true;
    }
  }

  // Si no coincide con ninguna ruta permitida, denegar acceso
  return false;
};

// Obtener todas las rutas permitidas para un usuario
export const getPermittedRoutes = (userPermissions: string[]): string[] => {
  return userPermissions.flatMap(
    (permission) => permissionToRoutesMap[permission] || []
  );
};

// Nombres legibles para menús
export const permissionToDisplayName: DisplayNames = {
  Dashboard: "Dashboard",
  Ventas: "Ventas",
  facturacion: "Facturación",
  operaciones: "Operaciones",
  empleados: "Empleados",
  inversores: "Inversores",
  finanzas: "Finanzas",
  precios: "Precios",
  marketing: "Marketing",
  gastos: "Gastos",
  deuda: "Deuda",
  clientes: "Clientes",
};
