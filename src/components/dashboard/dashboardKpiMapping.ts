// dashboardKpiMapping.ts

// Este objeto mapea las claves de los KPIs (cards) a los features que deben tener acceso a ellos
export const kpiToFeatureMap: { [key: string]: string[] } = {
  //  Basico por tener el dashboard
  bruto: ["Dashboard"],
  neto: ["Dashboard"],

  // Operaciones
  productos: ["Operaciones"],
  success: ["Operaciones"],
  express: ["Operaciones"],
  coccion: ["Operaciones"],
  entrega: ["Operaciones"],
  km: ["Operaciones"],
  costokm: ["Finanzas"],
  delivery: ["Operaciones"],
  takeaway: ["Operaciones"],
  clientes: ["Operaciones"],

  // finanzas
  ticket: ["Finanzas"],

  // sin pagina no se puede hacer
  extraOrders: ["Operaciones"],
  extraProducts: ["Operaciones"],
  canceledProducts: ["Operaciones"],
  canceledDelivery: ["Operaciones"],
  canceledTakeaway: ["Operaciones"],
  extraFacturacion: ["Finanzas"],
  canceledAmount: ["Finanzas"],
  canceledNetAmount: ["Finanzas"],
  priceFactor: ["Precios dinámicos"],
  general: ["Dashboard"],
  temperatura: ["Dashboard"],
  presentacion: ["Dashboard"],
  pagina: ["Dashboard", "Página de ventas"],
  tiempo: ["Dashboard", "Operaciones"],
};

// Función para verificar si un KPI debe mostrarse para un conjunto de features
export const shouldShowKpi = (
  kpiKey: string,
  userFeatures: string[]
): boolean => {
  const requiredFeatures = kpiToFeatureMap[kpiKey];

  // Si el KPI no está mapeado, lo mostramos por defecto
  if (!requiredFeatures || requiredFeatures.length === 0) {
    return true;
  }

  // Verificar si el usuario tiene al menos uno de los features requeridos
  return requiredFeatures.some((feature) => userFeatures.includes(feature));
};
