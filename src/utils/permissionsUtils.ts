// utils/permissionsUtils.ts

import { EmpresaProps, EmpleadoProps } from "../firebase/ClientesAbsolute";

// Definición de tipos
export interface PermissionMappings {
  [key: string]: string[];
}

export interface DisplayNames {
  [key: string]: string;
}

// Lista unificada de features del sistema
export const SYSTEM_FEATURES = [
  {
    id: "Dashboard",
    title: "Dashboard",
    description:
      "Visualiza el rendimiento de tu negocio en tiempo real. Analiza ventas y comportamiento de clientes para tomar decisiones estratégicas basadas en datos concretos.",
  },
  {
    id: "Facturación automática",
    title: "Facturación automática",
    description:
      "Ahorra horas de trabajo con facturas generadas al instante tras cada venta. Sistema personalizable que reduce errores y garantiza cumplimiento fiscal.",
  },
  {
    id: "Operaciones",
    title: "Operaciones",
    description:
      "Optimizamos tus procesos clave para maximizar eficiencia y reducir costos. Automatizamos cada paso para que puedas enfocarte en hacer crecer tu negocio.",
  },
  {
    id: "Empleados",
    title: "Empleados",
    description:
      "Gestiona asistencia, tareas y nóminas en una sola plataforma. Aumenta la productividad mientras reduces la carga administrativa de tu equipo de recursos humanos.",
  },
  {
    id: "Inversores",
    title: "Inversores",
    description:
      "Gestión profesional para captar capital y optimizar relaciones con inversores. Acelera el crecimiento de tu negocio con las estrategias financieras adecuadas.",
  },
  {
    id: "Finanzas",
    title: "Finanzas",
    description:
      "Conoce la rentabilidad exacta de cada producto. Calcula automáticamente márgenes y estructura de costos para tomar decisiones financieras informadas.",
  },
  {
    id: "Página de ventas",
    title: "Página de ventas",
    description:
      "Multiplica tus ventas con una tienda online integrada a nuestro sistema. Recibe pedidos 24/7 y ofrece una experiencia de compra excepcional.",
  },
  {
    id: "Precios dinámicos",
    title: "Precios dinámicos",
    description:
      "Incrementa ingresos ajustando precios según demanda e inventario. Nuestra IA sugiere el precio óptimo equilibrando volumen de ventas y margen de beneficio.",
  },
  {
    id: "WhatsApp Marketing",
    title: "WhatsApp Marketing",
    description:
      "Reconecta con clientes inactivos mediante campañas personalizadas de alto impacto. Segmenta audiencias y envía ofertas con la mayor tasa de conversión.",
  },
];

// Mapeo de características/permisos a rutas (relación 1:1)
export const featureToRouteMap: PermissionMappings = {
  Dashboard: ["/dashboard", "/notificaciones"],
  "Facturación automática": ["/facturacion"],
  Operaciones: ["/comanderaAutomatizada"],
  Empleados: ["/empleados"],
  Inversores: ["/deudaManager"],
  Finanzas: ["/gastos", "/neto", "/nuevaCompra"], // Ahora Finanzas da acceso a tres rutas
  "Página de ventas": ["/paginaDeVentas"],
  "Precios dinámicos": ["/preciosDinamicos"],
  "WhatsApp Marketing": ["/vouchers"],
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
  const publicRoutes = ["/", "/authentication", "/crearEmpresa"];

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

  // Comprobar permisos basados en la ruta actual
  for (const permiso of userPermissions) {
    const rutasPermitidas = featureToRouteMap[permiso] || [];
    for (const rutaPermitida of rutasPermitidas) {
      if (
        rutaPermitida &&
        (currentPath === rutaPermitida ||
          currentPath.startsWith(`${rutaPermitida}/`))
      ) {
        return true;
      }
    }
  }

  // Si no coincide con ninguna ruta permitida, denegar acceso
  return false;
};

// Obtener todas las rutas permitidas para un usuario
export const getPermittedRoutes = (userPermissions: string[]): string[] => {
  const routes: string[] = [];

  for (const permission of userPermissions) {
    const permissionRoutes = featureToRouteMap[permission] || [];
    routes.push(...permissionRoutes);
  }

  return routes;
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
