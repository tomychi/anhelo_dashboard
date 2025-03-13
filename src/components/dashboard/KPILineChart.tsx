import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  getKpiConfig,
  hasKpiPermission,
  EmpleadoProps,
  EmpresaProps,
} from "../../firebase/ClientesAbsolute";

const KPILineChart = ({ orders }) => {
  const [selectedKPIs, setSelectedKPIs] = useState(["productosVendidos"]);
  const [chartData, setChartData] = useState([]);
  const [availableKPIs, setAvailableKPIs] = useState([]);
  const [kpiConfig, setKpiConfig] = useState({});
  const [kpiConfigLoaded, setKpiConfigLoaded] = useState(false);

  // Obtener neto del estado global y datos de autenticación
  const { neto, facturacionTotal } = useSelector(
    (state: RootState) => state.data
  );

  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;

  // Obtener el ID del usuario actual
  const usuarioId =
    tipoUsuario === "empresa"
      ? (auth?.usuario as EmpresaProps)?.id || ""
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.id || ""
        : "";

  // Obtener el ID de la empresa
  const empresaId =
    tipoUsuario === "empresa"
      ? usuarioId
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.empresaId || ""
        : "";

  // Cargar configuración de KPIs
  useEffect(() => {
    const fetchKpiConfig = async () => {
      if (!empresaId) return;

      try {
        const config = await getKpiConfig(empresaId);
        setKpiConfig(config);
        setKpiConfigLoaded(true);
      } catch (error) {
        console.error("Error al cargar configuración de KPIs:", error);
        setKpiConfigLoaded(true); // Marcar como cargado incluso en caso de error
      }
    };

    fetchKpiConfig();
  }, [empresaId]);

  // Nueva función para contar productos considerando 2x1
  const contarProductos = (detallePedido) => {
    return detallePedido.reduce((total, item) => {
      const cantidad = item.quantity || 1;
      const es2x1 = item.burger && item.burger.toLowerCase().includes("2x1");
      return total + (es2x1 ? cantidad * 2 : cantidad);
    }, 0);
  };

  useEffect(() => {
    if (orders.length === 0) return;

    const ordersByDate = orders.reduce((acc, order) => {
      if (!order.fecha) return acc;
      const dateStr = order.fecha;
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(order);
      return acc;
    }, {});

    const dailyData = Object.entries(ordersByDate).map(
      ([dateStr, dailyOrders]) => {
        // Separar órdenes activas y canceladas
        const activeOrders = dailyOrders.filter((order) => !order.canceled);
        const canceledOrders = dailyOrders.filter((order) => order.canceled);

        // Facturación bruta activa
        const facturacionBrutaActiva = activeOrders.reduce(
          (sum, order) => sum + (Number(order.total) || 0),
          0
        );

        // Facturación bruta cancelada
        const facturacionBrutaCancelada = canceledOrders.reduce(
          (sum, order) => sum + (Number(order.total) || 0),
          0
        );

        // Calcular costos de órdenes activas
        const costosActivos = activeOrders.reduce((total, order) => {
          return (
            total +
            (order.detallePedido || []).reduce((subtotal, pedido) => {
              return subtotal + (pedido.costoBurger || 0);
            }, 0)
          );
        }, 0);

        // Calcular costos de órdenes canceladas
        const costosCancelados = canceledOrders.reduce((total, order) => {
          return (
            total +
            (order.detallePedido || []).reduce((subtotal, pedido) => {
              return subtotal + (pedido.costoBurger || 0);
            }, 0)
          );
        }, 0);

        // Calcular netos
        const facturacionNetaActiva = facturacionBrutaActiva - costosActivos;
        const facturacionNetaCancelada =
          facturacionBrutaCancelada - costosCancelados;

        const productosVendidos = activeOrders.reduce(
          (sum, order) =>
            sum +
            (order.detallePedido ? contarProductos(order.detallePedido) : 0),
          0
        );

        // Customer Success
        const pedidosDemorados = activeOrders.filter((order) => {
          if (!order.tiempoEntregado || !order.hora) return false;
          const horaEntrega = order.tiempoEntregado.split(":").map(Number);
          const horaInicio = order.hora.split(":").map(Number);
          const tiempoTotal =
            horaEntrega[0] * 60 +
            horaEntrega[1] -
            (horaInicio[0] * 60 + horaInicio[1]);
          return tiempoTotal > 60;
        }).length;

        const customerSuccess =
          activeOrders.length > 0
            ? Math.ceil(100 - (pedidosDemorados * 100) / activeOrders.length)
            : 0;

        // Cálculo de tiempos
        const tiemposCoccion = activeOrders
          .filter((order) => order.tiempoElaborado)
          .map((order) => {
            const [minutos] = order.tiempoElaborado.split(":").map(Number);
            return minutos;
          });

        const tiempoCoccion =
          tiemposCoccion.length > 0
            ? tiemposCoccion.reduce((sum, time) => sum + time, 0) /
              tiemposCoccion.length
            : 0;

        const tiemposEntrega = activeOrders
          .filter((order) => order.tiempoEntregado && order.hora)
          .map((order) => {
            const horaEntrega = order.tiempoEntregado.split(":").map(Number);
            const horaInicio = order.hora.split(":").map(Number);
            return (
              horaEntrega[0] * 60 +
              horaEntrega[1] -
              (horaInicio[0] * 60 + horaInicio[1])
            );
          });

        const tiempoEntregaTotal =
          tiemposEntrega.length > 0
            ? tiemposEntrega.reduce((sum, time) => sum + time, 0) /
              tiemposEntrega.length
            : 0;

        // Cálculo de KMs
        const kmRecorridos = activeOrders.reduce((total, order) => {
          if (!order.map || order.map.length !== 2) return total;
          return total + 5; // Ejemplo simplificado
        }, 0);

        // Calcular ratings promedios diarios
        const presentacionRatings = activeOrders
          .filter((order) => order.rating?.presentacion)
          .map((order) => order.rating.presentacion);

        const paginaRatings = activeOrders
          .filter((order) => order.rating?.pagina)
          .map((order) => order.rating.pagina);

        const avgPresentacion =
          presentacionRatings.length > 0
            ? presentacionRatings.reduce((sum, rating) => sum + rating, 0) /
              presentacionRatings.length
            : 0;

        const avgPagina =
          paginaRatings.length > 0
            ? paginaRatings.reduce((sum, rating) => sum + rating, 0) /
              paginaRatings.length
            : 0;

        return {
          fecha: dateStr,
          facturacionBrutaActiva,
          facturacionNetaActiva,
          facturacionBrutaCancelada,
          facturacionNetaCancelada,
          productosVendidos,
          ventasDelivery: activeOrders.length,
          customerSuccess,
          tiempoCoccion,
          tiempoEntregaTotal,
          kmRecorridos,
          ticketPromedio:
            activeOrders.length > 0
              ? facturacionBrutaActiva / activeOrders.length
              : 0,
          ratingPresentacion: avgPresentacion,
          ratingPagina: avgPagina,
        };
      }
    );

    const sortedData = dailyData.sort((a, b) => {
      const [diaA, mesA, añoA] = a.fecha.split("/");
      const [diaB, mesB, añoB] = b.fecha.split("/");
      const fechaA = new Date(Number(añoA), Number(mesA) - 1, Number(diaA));
      const fechaB = new Date(Number(añoB), Number(mesB) - 1, Number(diaB));
      return fechaA.getTime() - fechaB.getTime();
    });

    setChartData(sortedData);
  }, [orders, neto, facturacionTotal]);

  // Mapeo de IDs de KPIs del gráfico a IDs de KPIs en la configuración de permisos
  const kpiMapping = {
    facturacionBrutaActiva: "bruto",
    facturacionNetaActiva: "neto",
    facturacionBrutaCancelada: "canceledAmount",
    facturacionNetaCancelada: "canceledNetAmount",
    productosVendidos: "productos",
    ventasDelivery: "delivery",
    customerSuccess: "success",
    tiempoCoccion: "coccion",
    tiempoEntregaTotal: "entrega",
    kmRecorridos: "km",
    ticketPromedio: "ticket",
    ratingPresentacion: "presentacion",
    ratingPagina: "pagina",
  };

  const allKPIOptions = [
    {
      id: "facturacionBrutaActiva",
      name: "Facturación bruta",
      color: "#4F46E5", // Indigo-600 principal
    },
    { id: "facturacionNetaActiva", name: "Facturación neta", color: "#818CF8" }, // Indigo-400
    {
      id: "facturacionBrutaCancelada",
      name: "Facturación bruta cancelada",
      color: "#C7D2FE", // Indigo-200
    },
    {
      id: "facturacionNetaCancelada",
      name: "Facturación neta cancelada",
      color: "#312E81", // Indigo-900
    },
    { id: "productosVendidos", name: "Productos vendidos", color: "#6366F1" }, // Indigo-500
    { id: "ventasDelivery", name: "Ventas delivery", color: "#4338CA" }, // Indigo-700
    { id: "customerSuccess", name: "Customer success", color: "#A78BFA" }, // Violet-400 - complementario
    { id: "tiempoCoccion", name: "Tiempo cocción promedio", color: "#8B5CF6" }, // Violet-500 - complementario
    {
      id: "tiempoEntregaTotal",
      name: "Tiempo entrega total",
      color: "#7C3AED", // Violet-600 - complementario
    },
    { id: "kmRecorridos", name: "KMs recorridos", color: "#6D28D9" }, // Violet-700 - complementario
    { id: "ticketPromedio", name: "Ticket promedio", color: "#5B21B6" }, // Violet-800 - complementario
    { id: "ratingPresentacion", name: "Rating Presentación", color: "#2563EB" }, // Blue-600 - análogo
    { id: "ratingPagina", name: "Rating Página", color: "#1D4ED8" }, // Blue-700 - análogo
  ];

  // Filtrar los KPIs según los permisos del usuario
  useEffect(() => {
    if (!kpiConfigLoaded) return;

    // Filtrar los KPIs a los que el usuario tiene acceso
    const filteredKPIs = allKPIOptions.filter((kpi) => {
      const configKpiKey = kpiMapping[kpi.id];
      return hasKpiPermission(configKpiKey, kpiConfig, usuarioId);
    });

    setAvailableKPIs(filteredKPIs);

    // Resetear los KPIs seleccionados
    setSelectedKPIs((prevSelected) => {
      const newSelected = prevSelected.filter((id) =>
        filteredKPIs.some((kpi) => kpi.id === id)
      );

      // Si no queda ningún KPI seleccionado, seleccionar el primero disponible
      if (newSelected.length === 0 && filteredKPIs.length > 0) {
        return [filteredKPIs[0].id];
      }

      return newSelected;
    });
  }, [kpiConfigLoaded, kpiConfig, usuarioId]);

  const toggleKPI = (kpiId) => {
    setSelectedKPIs((prev) =>
      prev.includes(kpiId)
        ? prev.filter((id) => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  // Si la configuración de KPIs no se ha cargado, mostrar un indicador de carga
  if (!kpiConfigLoaded) {
    return (
      <div className="bg-gray-100 mt-4 pt-4 rounded-lg shadow-2xl shadow-gray-400 mb-4 pb-2 h-[250px] flex items-center justify-center">
        <p className="text-gray-500">Cargando gráficos...</p>
      </div>
    );
  }

  // Si no hay KPIs disponibles, mostrar un mensaje
  if (availableKPIs.length === 0) {
    return (
      <div className="bg-white mt-4 pt-4 rounded-lg shadow-2xl shadow-gray-400 mb-4 pb-2 h-[250px] flex items-center justify-center">
        <p className="text-gray-500 px-8 text-center">
          No hay gráficos disponibles con tus permisos actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 mt-4 pt-4 rounded-lg shadow-2xl shadow-gray-400 mb-4 pb-2">
      <div className="md:pt-4">
        <p className="md:text-5xl text-2xl font-bold pb-4 mt-2 text-center border-b border-black border-opacity-20">
          KPIs en el tiempo
        </p>
        <div className="flex px-4 flex-wrap gap-2 mb-4 mt-4 md:justify-center">
          {availableKPIs.map((kpi) => (
            <button
              key={kpi.id}
              onClick={() => toggleKPI(kpi.id)}
              className={`px-4 h-10 rounded-lg text-xs ${
                selectedKPIs.includes(kpi.id)
                  ? "bg-black text-white"
                  : "bg-gray-200 text-black"
              }`}
              style={{
                borderLeft: selectedKPIs.includes(kpi.id)
                  ? `4px solid ${kpi.color}`
                  : "4px solid transparent",
              }}
            >
              {kpi.name}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[175px] pr-4 md:h-[300px] flex w-full">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="fecha"
              tickFormatter={(value) => {
                const [dia, mes] = value.split("/");
                return `${dia}/${mes}`;
              }}
            />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                if (typeof value === "number") {
                  if (name === "customerSuccess") return `${value.toFixed(1)}%`;
                  if (name.includes("Tiempo")) return `${value.toFixed(1)} min`;
                  if (name.includes("KMs")) return `${value.toFixed(1)} km`;
                  if (name.includes("Facturación") || name.includes("Ticket"))
                    return `$${value.toFixed(0)}`;
                  if (name.includes("Rating")) return `${value.toFixed(1)}/5`;
                  return value.toFixed(0);
                }
                return value;
              }}
            />
            {availableKPIs.map(
              (kpi) =>
                selectedKPIs.includes(kpi.id) && (
                  <Bar
                    key={kpi.id}
                    dataKey={kpi.id}
                    name={kpi.name}
                    fill={kpi.color}
                    barSize={40}
                  />
                )
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default KPILineChart;
