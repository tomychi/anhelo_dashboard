import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { CardInfo } from "../components/dashboard";
import { getCustomers } from "../helpers/orderByweeks";
import { calculateKMS } from "../helpers";
import {
  calcularPromedioTiempoElaboracion,
  promedioTiempoDeEntregaTotal,
  contarPedidosDemorados,
} from "../helpers/dateToday";
import { ReadMateriales } from "../firebase/Materiales";
import { readMaterialsAll } from "../redux/materials/materialAction";
import { readProductsAll } from "../redux/products/productAction";
import { ReadData } from "../firebase/ReadData";
import { calcularCostoHamburguesa } from "../helpers/calculator";
import { ProductStateProps } from "../redux/products/productReducer";
import { Cadete, PedidoProps } from "../types/types"; // Importa PedidoProps
import KPILineChart from "../components/dashboard/KPILineChart";
import AddKpiCard from "../components/dashboard/AddKpiCard";
import {
  EmpresaProps,
  EmpleadoProps,
  getKpiConfig,
  hasKpiPermission,
  subscribeToKpiConfig,
} from "../firebase/ClientesAbsolute";
import EmployeeViewSimulation from "../components/dashboard/EmployeeViewSimulation";

interface RatingInfo {
  average: string;
  count: number;
}

interface AverageRatings {
  general: RatingInfo;
  temperatura: RatingInfo;
  presentacion: RatingInfo;
  pagina: RatingInfo;
  tiempo: RatingInfo;
  productos: RatingInfo;
}

// Nueva función para calcular KPIs con soporte para datos diarios
const calculateKPIWithDailyData = (orders, field, filterFn = null) => {
  // Agrupar por fecha
  const dailyData = {};

  orders.forEach((order) => {
    // Solo considerar las órdenes que cumplan con el filtro (si existe)
    if (filterFn && !filterFn(order)) {
      return;
    }

    const fecha = order.fecha; // Formato DD/MM/YYYY

    // Convertir a formato ISO para ordenación y compatibilidad
    const [dia, mes, anio] = fecha.split("/");
    const fechaISO = `${anio}-${mes}-${dia}`; // YYYY-MM-DD

    // Inicializar el contador para esta fecha si no existe
    if (!dailyData[fechaISO]) {
      dailyData[fechaISO] = 0;
    }

    // Incrementar el contador para esta fecha
    if (field === "count") {
      // Si solo estamos contando elementos
      dailyData[fechaISO] += 1;
    } else if (typeof order[field] === "number") {
      // Si estamos sumando un campo numérico
      dailyData[fechaISO] += order[field];
    } else if (
      field === "detallePedido" &&
      Array.isArray(order.detallePedido)
    ) {
      // Caso especial para contar productos
      const additionalQuantity = order.detallePedido.reduce((acc, detail) => {
        const extraForPromo =
          detail.burger && detail.burger.includes("2x1") ? detail.quantity : 0;
        return acc + detail.quantity + extraForPromo;
      }, 0);
      dailyData[fechaISO] += additionalQuantity;
    }
  });

  // Calcular el total sumando todos los valores diarios
  const total = Object.values(dailyData).reduce(
    (sum, value) => sum + (value as number),
    0
  );

  return {
    total,
    dailyData,
  };
};

// Función para calcular costos con datos diarios
const calculateCostWithDailyData = (orders, filterFn = null) => {
  const dailyData = {};

  orders.forEach((order) => {
    // Solo considerar las órdenes que cumplan con el filtro (si existe)
    if (filterFn && !filterFn(order)) {
      return;
    }

    const fecha = order.fecha; // Formato DD/MM/YYYY

    // Convertir a formato ISO
    const [dia, mes, anio] = fecha.split("/");
    const fechaISO = `${anio}-${mes}-${dia}`; // YYYY-MM-DD

    // Inicializar el acumulador para esta fecha
    if (!dailyData[fechaISO]) {
      dailyData[fechaISO] = 0;
    }

    // Calcular costo para esta orden
    if (order.detallePedido && Array.isArray(order.detallePedido)) {
      const orderCost = order.detallePedido.reduce((subtotal, pedido) => {
        return subtotal + (pedido.costoBurger || 0);
      }, 0);

      dailyData[fechaISO] += orderCost;
    }
  });

  // Calcular el total
  const totalCost = Object.values(dailyData).reduce(
    (sum, value) => sum + (value as number),
    0
  );

  return {
    total: totalCost,
    dailyData,
  };
};

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch();

  // Estado para almacenar la configuración de KPIs
  const [kpiConfig, setKpiConfig] = useState<{
    [kpiKey: string]: {
      accessIds: string[];
      modifiers: { [userId: string]: number };
    };
  }>({});
  const [kpiConfigLoaded, setKpiConfigLoaded] = useState(false);
  const [isDashboardConfigured, setIsDashboardConfigured] = useState<
    boolean | null
  >(null);

  // Estados para la simulación de vista de empleado
  const [simulatingEmployee, setSimulatingEmployee] = useState(null);
  const [simulatingEmployeeData, setSimulatingEmployeeData] = useState(null);
  const [simulationKpiConfig, setSimulationKpiConfig] = useState(null);

  // Resto de los estados
  const [totalPaga, setTotalPaga] = useState(0);
  const [totalDirecciones, setTotalDirecciones] = useState(0);
  const {
    valueDate,
    orders,
    facturacionTotal,
    totalProductosVendidos,
    neto,
    telefonos,
    vueltas,
    isLoading,
  } = useSelector((state: RootState) => state.data);

  // Calcular los datos diarios para diferentes KPIs
  const deliveryData = calculateKPIWithDailyData(
    orders,
    "count",
    (order) => order.deliveryMethod === "delivery" && !order.canceled
  );
  const deliveryCount = deliveryData.total;
  const deliveryDailyData = deliveryData.dailyData;

  const takeawayData = calculateKPIWithDailyData(
    orders,
    "count",
    (order) => order.deliveryMethod === "takeaway" && !order.canceled
  );
  const takeawayCount = takeawayData.total;
  const takeawayDailyData = takeawayData.dailyData;

  const facturacionData = calculateKPIWithDailyData(
    orders,
    "total",
    (order) => !order.canceled
  );
  const facturacionRealTotal = facturacionData.total;
  const facturacionDailyData = facturacionData.dailyData;

  // Calcular costos para determinar facturación neta
  const costosData = calculateCostWithDailyData(
    orders,
    (order) => !order.canceled
  );
  const totalCostos = costosData.total;
  const costosDailyData = costosData.dailyData;

  // Calcular facturación neta por día
  const netoDailyData = {};
  Object.keys(facturacionDailyData).forEach((fecha) => {
    netoDailyData[fecha] =
      facturacionDailyData[fecha] - (costosDailyData[fecha] || 0);
  });
  const netoTotal = Object.values(netoDailyData).reduce(
    (sum, value) => sum + (value as number),
    0
  );

  // Calcular productos vendidos con datos diarios
  const productosData = calculateKPIWithDailyData(
    orders,
    "detallePedido",
    (order) => !order.canceled
  );
  const totalProductosReal = productosData.total;
  const productosDailyData = productosData.dailyData;

  // Obtener información del usuario autenticado
  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;

  // Obtener el ID del usuario actual
  const usuarioId =
    tipoUsuario === "empresa"
      ? (auth?.usuario as EmpresaProps)?.id || ""
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.id || ""
        : "";

  const isEmpresario = tipoUsuario === "empresa";

  const [effectiveUserId, setEffectiveUserId] = useState(usuarioId);

  // Función para manejar la simulación de vista de empleado
  const handleSimulateEmployeeView = async (employeeId, employeeData) => {
    if (!employeeId || !auth?.usuario?.id) return;

    try {
      // Obtener la ID de la empresa
      const empresaId = auth?.usuario?.id;

      // Guardar los datos del empleado seleccionado
      setSimulatingEmployee(employeeId);
      setSimulatingEmployeeData(employeeData);

      // Establecer el ID de usuario efectivo como el del empleado
      setEffectiveUserId(employeeId);

      // Obtener la configuración de KPIs para simular la vista del empleado
      const config = await getKpiConfig(empresaId);
      setSimulationKpiConfig(config);

      // Notificar al usuario que la simulación está activa
      console.log(`Simulando vista para: ${employeeData?.datos?.nombre}`);
    } catch (error) {
      console.error("Error al simular vista:", error);
      // Resetear la simulación en caso de error
      setSimulatingEmployee(null);
      setSimulatingEmployeeData(null);
      setSimulationKpiConfig(null);
      setEffectiveUserId(usuarioId);
    }
  };

  // Función para finalizar la simulación
  const endSimulation = () => {
    setSimulatingEmployee(null);
    setSimulatingEmployeeData(null);
    setSimulationKpiConfig(null);
    // Restaurar el ID de usuario efectivo al original
    setEffectiveUserId(usuarioId);
  };

  // Cargar configuración de KPIs
  useEffect(() => {
    if (!auth?.usuario) return;

    // Para empleados, necesitamos obtener el ID de la empresa a la que pertenecen
    const empresaId =
      tipoUsuario === "empresa"
        ? auth.usuario.id || ""
        : tipoUsuario === "empleado"
          ? (auth?.usuario as EmpleadoProps)?.empresaId || ""
          : "";

    if (empresaId) {
      // Cargar configuración inicial
      const fetchInitialConfig = async () => {
        const config = await getKpiConfig(empresaId);
        setKpiConfig(config);
        setKpiConfigLoaded(true);
        setIsDashboardConfigured(Object.keys(config).length > 0);
      };

      fetchInitialConfig();

      // Establecer el listener para actualizaciones en tiempo real
      const unsubscribe = subscribeToKpiConfig(empresaId, (newConfig) => {
        setKpiConfig(newConfig);
        setKpiConfigLoaded(true);
        setIsDashboardConfigured(Object.keys(newConfig).length > 0);
      });

      // Limpieza del efecto para cancelar la suscripción cuando se desmonte el componente
      return () => {
        unsubscribe();
      };
    }
  }, [auth, tipoUsuario]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const materialesData = await ReadMateriales();
        dispatch(readMaterialsAll(materialesData));

        const productsData = await ReadData();
        const formattedData: ProductStateProps[] = productsData.map(
          (item: any) => ({
            collectionName: item.collectionName,
            id: item.id,
            data: {
              description: item.data.description,
              img: item.data.img,
              name: item.data.name,
              price: item.data.price,
              type: item.data.type,
              ingredients: item.data.ingredients,
              id: item.id,
              costo: calcularCostoHamburguesa(
                materialesData,
                item.data.ingredients
              ),
            },
          })
        );

        dispatch(readProductsAll(formattedData));
      } catch (error: any) {}
    };

    fetchData();
  }, [dispatch]);

  // Log orders with priceFactor
  useEffect(() => {
    const ordersWithPriceFactor = orders.filter(
      (order) => "priceFactor" in order
    );
    const mappedOrders = ordersWithPriceFactor.map((order) => ({
      id: order.id,
      fecha: order.fecha,
      total: order.total,
      priceFactor: order.priceFactor,
      originalAmount: Number((order.total / order.priceFactor).toFixed(2)),
    }));

    const totalDifference = mappedOrders.reduce((acc, order) => {
      const difference = order.total - order.originalAmount;
      return acc + difference;
    }, 0);
  }, [orders]);

  const startDate = valueDate?.startDate
    ? new Date(valueDate.startDate)
    : new Date();
  const customers = getCustomers(telefonos, orders, startDate);

  useEffect(() => {
    const calcularTotalPaga = () => {
      if (!vueltas || vueltas.length === 0) return 0;

      return vueltas.reduce((totalCadetes, cadete) => {
        if (!cadete.vueltas || cadete.vueltas.length === 0) return totalCadetes;

        const totalCadete = cadete.vueltas.reduce((totalVueltas, vuelta) => {
          return totalVueltas + (vuelta.paga || 0);
        }, 0);

        return totalCadetes + totalCadete;
      }, 0);
    };

    const nuevoTotalPaga = calcularTotalPaga();
    setTotalPaga(nuevoTotalPaga);

    const nuevaTotalDirecciones = calculateTotalDirecciones(vueltas);
    setTotalDirecciones(nuevaTotalDirecciones);
  }, [vueltas]);

  const calculateAverageRatings = (orders: PedidoProps[]): AverageRatings => {
    const ordersWithRatings = orders.filter(
      (order) =>
        order.rating &&
        typeof order.rating === "object" &&
        Object.keys(order.rating).length > 0
    );

    const generalRatings = ["presentacion", "tiempo", "temperatura", "pagina"];
    const initialTotals: { [key: string]: { sum: number; count: number } } = {
      general: { sum: 0, count: 0 },
      temperatura: { sum: 0, count: 0 },
      presentacion: { sum: 0, count: 0 },
      pagina: { sum: 0, count: 0 },
      tiempo: { sum: 0, count: 0 },
      productos: { sum: 0, count: 0 },
    };

    const totals = ordersWithRatings.reduce((acc, order) => {
      if (order.rating && typeof order.rating === "object") {
        Object.entries(order.rating).forEach(([key, value]) => {
          if (typeof value === "number") {
            const lowerKey = key.toLowerCase();
            if (!generalRatings.includes(lowerKey)) {
              acc["productos"].sum += value;
              acc["productos"].count += 1;
            } else {
              if (acc[lowerKey]) {
                acc[lowerKey].sum += value;
                acc[lowerKey].count += 1;
              }
            }
          }
        });
      }
      return acc;
    }, initialTotals);

    const averages: { [key: string]: number } = {
      temperatura:
        totals.temperatura.count > 0
          ? totals.temperatura.sum / totals.temperatura.count
          : 0,
      presentacion:
        totals.presentacion.count > 0
          ? totals.presentacion.sum / totals.presentacion.count
          : 0,
      pagina:
        totals.pagina.count > 0 ? totals.pagina.sum / totals.pagina.count : 0,
      tiempo:
        totals.tiempo.count > 0 ? totals.tiempo.sum / totals.tiempo.count : 0,
      productos:
        totals.productos.count > 0
          ? totals.productos.sum / totals.productos.count
          : 0,
    };

    const generalAverage =
      Object.values(averages).reduce((sum, value) => sum + value, 0) /
      Object.keys(averages).length;

    return {
      general: {
        average: generalAverage.toFixed(1),
        count: ordersWithRatings.length,
      },
      temperatura: {
        average: averages.temperatura.toFixed(1),
        count: totals.temperatura.count,
      },
      presentacion: {
        average: averages.presentacion.toFixed(1),
        count: totals.presentacion.count,
      },
      pagina: {
        average: averages.pagina.toFixed(1),
        count: totals.pagina.count,
      },
      tiempo: {
        average: averages.tiempo.toFixed(1),
        count: totals.tiempo.count,
      },
      productos: {
        average: averages.productos.toFixed(1),
        count: totals.productos.count,
      },
    };
  };

  const averageRatings: AverageRatings = calculateAverageRatings(orders);

  const expressTotalCount = orders.filter(
    (order) => order.envioExpress && order.envioExpress > 0
  ).length;

  const canceledOrders = orders.filter((order) => order.canceled);

  const canceledOrdersTotal = canceledOrders.reduce(
    (acc, order) => acc + order.total,
    0
  );

  // CORRECCIÓN: Verificar que detallePedido existe y es un array
  const canceledProducts = orders
    .filter((order) => order.canceled)
    .reduce((total, order) => {
      if (!order.detallePedido || !Array.isArray(order.detallePedido)) {
        return total;
      }
      return (
        total +
        order.detallePedido.reduce((accumulator, detail) => {
          const additionalQuantity =
            detail.burger && detail.burger.includes("2x1")
              ? detail.quantity
              : 0;
          return accumulator + detail.quantity + additionalQuantity;
        }, 0)
      );
    }, 0);

  // CORRECCIÓN: Verificar que detallePedido existe y es un array
  const canceledCostTotal = canceledOrders.reduce((total, order) => {
    if (!order.detallePedido || !Array.isArray(order.detallePedido)) {
      return total;
    }
    return (
      total +
      order.detallePedido.reduce((subtotal, pedido) => {
        return subtotal + (pedido.costoBurger || 0);
      }, 0)
    );
  }, 0);

  // Calcular la facturación neta cancelada (facturación cancelada - costos cancelados)
  const canceledNetAmount = canceledOrdersTotal - canceledCostTotal;

  const canceledDeliveryOrders = canceledOrders.filter(
    (order) => order.deliveryMethod === "delivery"
  );
  const canceledTakeawayOrders = canceledOrders.filter(
    (order) => order.deliveryMethod === "takeaway"
  );

  // CORRECCIÓN: Verificar que detallePedido existe y es un array
  const ordersWithExtra = orders.filter(
    (order) =>
      order.detallePedido &&
      Array.isArray(order.detallePedido) &&
      order.detallePedido.some((detalle) => detalle.extra === true)
  );

  // CORRECCIÓN: Verificar que detallePedido existe y es un array
  const extraProductsCount = orders.reduce((total, order) => {
    if (!order.detallePedido || !Array.isArray(order.detallePedido)) {
      return total;
    }
    return (
      total +
      order.detallePedido.reduce((subTotal, producto) => {
        return producto.extra === true
          ? subTotal + producto.quantity
          : subTotal;
      }, 0)
    );
  }, 0);

  // CORRECCIÓN: Verificar que detallePedido existe y es un array
  const extraOrdersDetails = ordersWithExtra.map((order) => ({
    id: order.id,
    fecha: order.fecha,
    hora: order.hora,
    total: order.total,
    detalle:
      order.detallePedido && Array.isArray(order.detallePedido)
        ? order.detallePedido
            .filter((detalle) => detalle.extra === true)
            .map((detalle) => ({
              burger: detalle.burger,
              price: detalle.priceBurger,
              quantity: detalle.quantity,
              subTotal: detalle.subTotal,
            }))
        : [],
  }));

  // Calcular dynamic price extra con datos diarios
  const calculateDynamicPriceExtra = () => {
    const ordersWithPriceFactor = orders.filter(
      (order) => "priceFactor" in order
    );

    const dailyData = {};

    ordersWithPriceFactor.forEach((order) => {
      const fecha = order.fecha; // Formato DD/MM/YYYY
      const [dia, mes, anio] = fecha.split("/");
      const fechaISO = `${anio}-${mes}-${dia}`; // YYYY-MM-DD

      if (!dailyData[fechaISO]) {
        dailyData[fechaISO] = 0;
      }

      const originalAmount = order.total / order.priceFactor;
      const extraAmount = order.total - originalAmount;

      dailyData[fechaISO] += extraAmount;
    });

    const totalExtraAmount = Object.values(dailyData).reduce(
      (sum, value) => sum + (value as number),
      0
    );

    return {
      total: totalExtraAmount,
      dailyData,
    };
  };

  const dynamicPriceData = calculateDynamicPriceExtra();
  const dynamicPriceExtra = dynamicPriceData.total;
  const dynamicPriceDailyData = dynamicPriceData.dailyData;

  // Calcular extras al final con datos diarios
  const calculateExtrasAlfinal = () => {
    const dailyData = {};

    orders.forEach((order) => {
      if (!order.detallePedido || !Array.isArray(order.detallePedido)) {
        return;
      }

      const fecha = order.fecha; // Formato DD/MM/YYYY
      const [dia, mes, anio] = fecha.split("/");
      const fechaISO = `${anio}-${mes}-${dia}`; // YYYY-MM-DD

      if (!dailyData[fechaISO]) {
        dailyData[fechaISO] = 0;
      }

      const extrasValue = order.detallePedido
        .filter((producto) => producto.extra)
        .reduce(
          (subtotal, producto) =>
            subtotal + producto.priceBurger * producto.quantity,
          0
        );

      dailyData[fechaISO] += extrasValue;
    });

    const totalExtras = Object.values(dailyData).reduce(
      (sum, value) => sum + (value as number),
      0
    );

    return {
      total: totalExtras,
      dailyData,
    };
  };

  const extrasData = calculateExtrasAlfinal();
  const extrasTotal = extrasData.total;
  const extrasDailyData = extrasData.dailyData;

  const analyzeCustomersData = (customers) => {
    // console.log("🔍 DEBUGGING CLIENTES =======================");
    // console.log("📊 Datos completos de customers:", customers);

    if (customers && customers.newCustomers) {
      // console.log(
      //   "👥 Cantidad de nuevos clientes:",
      //   customers.newCustomers.length
      // );

      // Intentemos agrupar los clientes por fecha
      const dailyCustomers = {};

      customers.newCustomers.forEach((customer) => {
        // Verificar si el cliente tiene fecha
        if (customer.fecha) {
          // Formatear la fecha al formato ISO YYYY-MM-DD
          const [dia, mes, anio] = customer.fecha.split("/");
          const fechaISO = `${anio}-${mes}-${dia}`;

          if (!dailyCustomers[fechaISO]) {
            dailyCustomers[fechaISO] = 0;
          }

          dailyCustomers[fechaISO] += 1;
        } else {
          // console.log("⚠️ Cliente sin fecha:", customer);
        }
      });

      // console.log("📅 Nuevos clientes agrupados por fecha:", dailyCustomers);
      return {
        total: customers.newCustomers.length,
        dailyData: dailyCustomers,
      };
    } else {
      // console.log("❌ No hay datos de nuevos clientes o estructura incorrecta");
      return {
        total: 0,
        dailyData: {},
      };
    }
  };

  // console.log("🚀 Inicializando card de clientes");
  const clientesData = analyzeCustomersData(customers);
  // console.log("✅ Datos procesados de clientes:", clientesData);

  const allCards = [
    <CardInfo
      key="bruto"
      info={currencyFormat(Math.ceil(facturacionRealTotal))}
      originalDailyData={facturacionDailyData}
      link={"bruto"}
      title={"Facturación bruta"}
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="neto"
      info={currencyFormat(Math.ceil(netoTotal))}
      originalDailyData={netoDailyData}
      cuadrito={
        facturacionRealTotal > 0 ? (netoTotal * 100) / facturacionRealTotal : 0
      }
      title={"Facturación neta"}
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="productos"
      info={totalProductosReal.toString()}
      originalDailyData={productosDailyData}
      link={"productosVendidos"}
      title={"Productos vendidos"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="delivery"
      info={deliveryCount.toString()}
      originalDailyData={deliveryDailyData}
      link={"ventas"}
      title={"Ventas delivery"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="takeaway"
      info={takeawayCount.toString()}
      originalDailyData={takeawayDailyData}
      link={"ventas"}
      title={"Ventas take away"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="priceFactor"
      info={currencyFormat(Math.ceil(dynamicPriceExtra))}
      originalDailyData={dynamicPriceDailyData}
      title={"Extra por Dynamic price"}
      cuadrito={
        facturacionRealTotal > 0
          ? (dynamicPriceExtra * 100) / facturacionRealTotal
          : 0
      }
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="extraOrders"
      info={ordersWithExtra.length.toString()}
      title={"Pedidos con extras al final"}
      isLoading={isLoading}
      cuadrito={
        facturacionRealTotal > 0
          ? (ordersWithExtra.length * 100) / (deliveryCount + takeawayCount)
          : 0
      }
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="extraProducts"
      info={extraProductsCount.toString()}
      title={"Productos extra al final"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="extraFacturacion"
      info={currencyFormat(extrasTotal)}
      originalDailyData={extrasDailyData}
      title={"Facturación por extras"}
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="canceledAmount"
      info={currencyFormat(Math.round(canceledOrdersTotal))}
      title={"Facturación bruta cancelada"}
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="canceledNetAmount"
      info={currencyFormat(Math.ceil(canceledNetAmount))}
      cuadrito={
        canceledOrdersTotal > 0
          ? (canceledNetAmount * 100) / canceledOrdersTotal
          : 0
      }
      title={"Facturación neta cancelada"}
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="canceledProducts"
      info={canceledProducts.toString()}
      title={"Productos cancelados"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="canceledDelivery"
      info={canceledDeliveryOrders.length.toString()}
      title={"Ventas delivery canceladas"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="canceledTakeaway"
      info={canceledTakeawayOrders.length.toString()}
      title={"Ventas take away canceladas"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="success"
      info={`${Math.ceil(
        orders.length > 0
          ? 100 - (contarPedidosDemorados(orders) * 100) / orders.length
          : 0
      )}%`}
      title={"Customer success"}
      isLoading={isLoading}
      formatType="integer" // Porcentaje como entero
    />,
    <CardInfo
      key="express"
      info={expressTotalCount.toString()}
      title="Envio express"
      cuadrito={
        orders.length > 0
          ? ((expressTotalCount / orders.length) * 100).toFixed(2)
          : "0"
      }
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="coccion"
      info={`${Math.round(calcularPromedioTiempoElaboracion(orders))} M`}
      title={"Tiempo cocción promedio"}
      isLoading={isLoading}
      formatType="integer" // Tiempos como enteros
    />,
    <CardInfo
      key="entrega"
      info={`${Math.round(promedioTiempoDeEntregaTotal(orders))} M`}
      title={"Tiempo total promedio"}
      isLoading={isLoading}
      formatType="integer" // Tiempos como enteros
    />,
    <CardInfo
      key="km"
      info={`${Math.round(calculateKMS(orders))} km`}
      title={"Km recorridos"}
      isLoading={isLoading}
      formatType="integer" // Distancias como enteros
    />,
    <CardInfo
      key="costokm"
      info={currencyFormat(
        orders.length > 0 && totalDirecciones > 0
          ? totalPaga / totalDirecciones
          : 0
      )}
      title={"Costo promedio delivery"}
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="clientes"
      info={clientesData.total.toString()}
      originalDailyData={clientesData.dailyData}
      link={"clientes"}
      title={"Nuevos clientes"}
      isLoading={isLoading}
      formatType="integer" // Conteos siempre como enteros
    />,
    <CardInfo
      key="ticket"
      info={
        orders.length > 0
          ? currencyFormat(Math.round(facturacionRealTotal / orders.length))
          : currencyFormat(0)
      }
      title={"Ticket promedio"}
      isLoading={isLoading}
      formatType="integer" // Moneda como entero
    />,
    <CardInfo
      key="general"
      info={averageRatings.general.average}
      title={"Rating general"}
      cuadrito={averageRatings.general.count}
      showAsRatings={true}
      isLoading={isLoading}
      formatType="decimal" // Ratings con un decimal
    />,
    <CardInfo
      key="temperatura"
      info={averageRatings.temperatura.average}
      title={"Temperatura"}
      cuadrito={averageRatings.temperatura.count}
      showAsRatings={true}
      isLoading={isLoading}
      formatType="decimal" // Ratings con un decimal
    />,
    <CardInfo
      key="presentacion"
      info={averageRatings.presentacion.average}
      title={"Presentación"}
      cuadrito={averageRatings.presentacion.count}
      showAsRatings={true}
      isLoading={isLoading}
      formatType="decimal" // Ratings con un decimal
    />,
    <CardInfo
      key="pagina"
      info={averageRatings.pagina.average}
      title={"Página"}
      cuadrito={averageRatings.pagina.count}
      showAsRatings={true}
      isLoading={isLoading}
      formatType="decimal" // Ratings con un decimal
    />,
    <CardInfo
      key="tiempo"
      info={averageRatings.tiempo.average}
      title={"Tiempo"}
      cuadrito={averageRatings.tiempo.count}
      showAsRatings={true}
      isLoading={isLoading}
      formatType="decimal" // Ratings con un decimal
    />,
    <CardInfo
      key="productos-rating"
      info={averageRatings.productos.average}
      title={"Productos"}
      cuadrito={averageRatings.productos.count}
      showAsRatings={true}
      isLoading={isLoading}
      formatType="decimal" // Ratings con un decimal
    />,
  ];

  const cardsToRender = allCards
    .filter((card) => {
      const cardKey = card.key as string;

      // Si la configuración de KPIs no se ha cargado aún, no mostrar nada
      if (!kpiConfigLoaded) {
        return false;
      }

      // Si estamos simulando un empleado, usar su ID para determinar permisos
      if (simulatingEmployee && simulationKpiConfig) {
        return hasKpiPermission(
          cardKey,
          simulationKpiConfig,
          simulatingEmployee
        );
      }

      // Caso normal: usar el ID del usuario actual
      return hasKpiPermission(cardKey, kpiConfig, usuarioId);
    })
    .map((card) => {
      const cardKey = card.key as string;

      // Si estamos simulando un empleado, usar la configuración de KPI simulada
      let kpiData;
      if (simulatingEmployee && simulationKpiConfig) {
        kpiData = simulationKpiConfig[cardKey] || {
          accessIds: [],
          modifiers: {},
        };
      } else {
        kpiData = kpiConfig[cardKey] || { accessIds: [], modifiers: {} };
      }

      // Pasar la clave del KPI, la lista de usuarios con acceso y los modificadores
      return React.cloneElement(card, {
        kpiKey: cardKey,
        accessUserIds: kpiData.accessIds || [],
        valueModifiers: kpiData.modifiers || {},
        effectiveUserId: effectiveUserId, // Pasar el ID de usuario efectivo
        simulatingEmployeeView: simulatingEmployee !== null, // Indicar si estamos en modo simulación
      });
    });

  const nombreUsuario =
    tipoUsuario === "empresa"
      ? (auth?.usuario as EmpresaProps)?.datosUsuario?.nombreUsuario || ""
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.datos?.nombre || ""
        : "";

  let greetingName;

  if (nombreUsuario.includes(" ")) {
    // Si tiene espacios (más de una palabra), tomar solo la primera
    greetingName = nombreUsuario.split(" ")[0];
  } else {
    // Si es una sola palabra, dejarlo como está
    greetingName = nombreUsuario;
  }

  const calculateTotalDirecciones = (vueltas: Cadete[] | undefined): number => {
    if (!vueltas) return 0;
    return vueltas.reduce((total: number, cadete) => {
      if (cadete.vueltas && Array.isArray(cadete.vueltas)) {
        return (
          total +
          cadete.vueltas.reduce((cadeteTotal, vuelta) => {
            return cadeteTotal + (vuelta.orders ? vuelta.orders.length : 0);
          }, 0)
        );
      }
      return total;
    }, 0);
  };

  return (
    <div className="min-h-screen font-coolvetica bg-gray-100 flex flex-col relative">
      <div className="bg-black px-4 pb-4">
        <Calendar />
        <div className="flex flex-row mt-8 mb-4 gap-2 items-baseline">
          <p
            className={`text-gray-100 ${simulatingEmployee ? "opacity-20" : ""} text-5xl`}
          >
            Hola{" "}
            {simulatingEmployee
              ? simulatingEmployeeData?.datos?.nombre.split(" ")[0]
              : greetingName.split(" ")[0]}
          </p>

          {isEmpresario ? (
            <>
              {simulatingEmployee ? (
                <div
                  className="flex items-center cursor-pointer"
                  onClick={endSimulation}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 text-gray-100"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 0L8 9.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 1.06-1.06L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 0 1 0 1.06Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <EmployeeViewSimulation
                  empresaId={auth?.usuario?.id}
                  onSimulateView={handleSimulateEmployeeView}
                />
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="absolute left-4 right-4 top-[130px] rounded-lg">
        <div className="flex flex-col shadow-2xl mb-4 shadow-gray-400 rounded-lg">
          {!kpiConfigLoaded ? (
            <div className="bg-white p-8 text-center rounded-lg">
              <p className="text-gray-400 font-light text-xs ">
                Cargando dashboard...
              </p>
            </div>
          ) : cardsToRender.length > 0 ? (
            <>
              {/* Renderizar los KPIs existentes */}
              {cardsToRender.map((card, index) =>
                React.cloneElement(card, {
                  key: index,
                  className: `
                  ${index === 0 ? "rounded-t-lg" : ""}
                  ${index === cardsToRender.length - 1 ? "rounded-b-lg" : ""}
                `,
                  isLoading: isLoading,
                })
              )}

              {/* Botón para añadir nuevo KPI (solo para empresarios y cuando NO está simulando) */}
              {isEmpresario && !simulatingEmployee && (
                <AddKpiCard className={`rounded-b-lg`} />
              )}
            </>
          ) : (
            <div className="flex flex-col rounded-lg ">
              <div className="bg-white p-8 font-light text-xs text-center rounded-lg">
                {isDashboardConfigured === false &&
                isEmpresario &&
                !simulatingEmployee ? (
                  <>
                    <p className="text-gray-400 mb-4">
                      Bienvenido! Configura tu dashboard para comenzar a
                      visualizar las métricas de negocio.
                    </p>
                  </>
                ) : simulatingEmployee ? (
                  <p className="text-gray-400">
                    Este empleado no tiene acceso a ningún KPI.
                    <span
                      className="text-blue-500 cursor-pointer ml-1"
                      onClick={endSimulation}
                    >
                      Volver a tu vista
                    </span>
                  </p>
                ) : (
                  <p className="text-gray-400">
                    No hay KPIs disponibles para mostrar con tus permisos
                    actuales.
                  </p>
                )}
              </div>

              {/* Mostrar el botón de agregar KPI incluso si no hay KPIs actuales */}
              {isEmpresario && <AddKpiCard className="rounded-b-lg" />}
            </div>
          )}
        </div>
        <KPILineChart
          orders={orders}
          effectiveUserId={effectiveUserId}
          simulatingEmployeeView={simulatingEmployee !== null}
        />
      </div>
    </div>
  );
};
