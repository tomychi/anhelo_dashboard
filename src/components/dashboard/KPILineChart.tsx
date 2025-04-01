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
  getEffectiveModifier,
} from "../../firebase/ClientesAbsolute";
import { convertDateFormat } from "../../helpers/dateToday";
import { cleanPhoneNumber } from "../../helpers/orderByweeks";

// Función mejorada para aplicar modificadores a valores, considerando rangos de fechas
const applyModifierImproved = (value, modifier = 1, dateKey = null) => {
  // Si el modificador es 1, no hay cambios
  if (typeof modifier === "number" && modifier === 1) {
    return value;
  }

  // Para modificadores basados en rangos de fecha
  if (
    dateKey &&
    typeof modifier === "object" &&
    modifier !== null &&
    modifier.type === "date_range"
  ) {
    // Obtener el modificador efectivo para esta fecha específica
    const effectiveModifier = getEffectiveModifier(modifier, dateKey);

    if (typeof value === "number") {
      return value * effectiveModifier;
    }
  }

  // Para modificadores simples (números)
  if (typeof modifier === "number") {
    if (typeof value === "number") {
      return value * modifier;
    } else if (typeof value === "string") {
      if (value.includes("$")) {
        const numMatch = value.match(/[\d,.]+/);
        if (numMatch) {
          const numStr = numMatch[0];
          const num = parseFloat(numStr.replace(/,/g, ""));
          if (!isNaN(num)) {
            const modifiedNum = Math.round(num * modifier);
            const prefix = value.substring(0, value.indexOf(numStr));
            const formattedNum = modifiedNum.toLocaleString("es-AR");
            return `${prefix}${formattedNum}`;
          }
        }
      } else {
        const num = parseFloat(value.replace(/,/g, ""));
        if (!isNaN(num)) {
          const modifiedNum = Math.round(num * modifier);
          return modifiedNum.toString();
        }
      }
    }
  }

  return value;
};

const KPILineChart = ({ orders }) => {
  const [selectedKPIs, setSelectedKPIs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [availableKPIs, setAvailableKPIs] = useState([]);
  const [kpiConfig, setKpiConfig] = useState({});
  const [kpiConfigLoaded, setKpiConfigLoaded] = useState(false);

  const { neto, facturacionTotal, vueltas, telefonos, valueDate } = useSelector(
    (state: RootState) => state.data
  );

  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;

  const usuarioId =
    tipoUsuario === "empresa"
      ? (auth?.usuario as EmpresaProps)?.id || ""
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.id || ""
        : "";

  const empresaId =
    tipoUsuario === "empresa"
      ? usuarioId
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.empresaId || ""
        : "";

  useEffect(() => {
    const fetchKpiConfig = async () => {
      if (!empresaId) return;

      try {
        const config = await getKpiConfig(empresaId);
        setKpiConfig(config);
        setKpiConfigLoaded(true);
      } catch (error) {
        console.error("Error al cargar configuración de KPIs:", error);
        setKpiConfigLoaded(true);
      }
    };

    fetchKpiConfig();
  }, [empresaId]);

  const contarProductos = (detallePedido) => {
    return detallePedido.reduce((total, item) => {
      const cantidad = item.quantity || 1;
      const es2x1 = item.burger && item.burger.toLowerCase().includes("2x1");
      return total + (es2x1 ? cantidad * 2 : cantidad);
    }, 0);
  };

  const calculateTotalDirecciones = (vueltas) => {
    if (!vueltas) return 0;
    return vueltas.reduce((total, cadete) => {
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

  const calculateAverageRatings = (dailyOrders) => {
    const ordersWithRatings = dailyOrders.filter(
      (order) =>
        order.rating &&
        typeof order.rating === "object" &&
        Object.keys(order.rating).length > 0
    );

    const generalRatings = ["presentacion", "tiempo", "temperatura", "pagina"];
    const initialTotals = {
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

    const averages = {
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
      general: generalAverage,
      temperatura: averages.temperatura,
      presentacion: averages.presentacion,
      pagina: averages.pagina,
      tiempo: averages.tiempo,
      productos: averages.productos,
    };
  };

  useEffect(() => {
    if (orders.length === 0 || !kpiConfigLoaded) return;

    const ordersByDate = orders.reduce((acc, order) => {
      if (!order.fecha) return acc;
      const dateStr = order.fecha;
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(order);
      return acc;
    }, {});

    const startDate = valueDate?.startDate
      ? new Date(valueDate.startDate)
      : new Date();

    // Crear un mapa para optimizar la búsqueda de teléfonos anteriores
    // Este mapa contiene todos los teléfonos que realizaron pedidos ANTES de startDate
    const existingPhoneMap = new Map();

    telefonos.forEach((cliente) => {
      try {
        // Si el teléfono ya tiene un registro de fecha anterior al startDate
        const clienteDate = new Date(convertDateFormat(cliente.fecha));
        const phoneClean = cleanPhoneNumber(cliente.telefono);

        if (clienteDate < startDate) {
          existingPhoneMap.set(phoneClean, true);
        }
      } catch (error) {
        console.error("Error procesando teléfono:", cliente, error);
      }
    });

    // Procesar órdenes por fecha para contar nuevos clientes
    const customersByDate = {};

    // Recorrer todas las órdenes agrupadas por fecha
    Object.entries(ordersByDate).forEach(([dateStr, dailyOrders]) => {
      // Para esta fecha, contar cuántos clientes son nuevos
      const newCustomersForDate = dailyOrders.filter((order) => {
        if (!order.telefono) return false;

        const orderPhone = cleanPhoneNumber(order.telefono);
        // Un cliente es nuevo si NO está en el mapa de teléfonos existentes
        return !existingPhoneMap.has(orderPhone);
      });

      // Guardar el conteo para esta fecha
      customersByDate[dateStr] = newCustomersForDate.length;
    });

    const dailyData = Object.entries(ordersByDate).map(
      ([dateStr, dailyOrders]) => {
        const activeOrders = dailyOrders.filter((order) => !order.canceled);
        const canceledOrders = dailyOrders.filter((order) => order.canceled);

        // Extraer la fecha en formato ISO para uso con modificadores
        const [dia, mes, anio] = dateStr.split("/");
        const fechaISO = `${anio}-${mes}-${dia}`; // YYYY-MM-DD

        // Facturación bruta
        const facturacionBruta = activeOrders.reduce(
          (sum, order) => sum + (Number(order.total) || 0),
          0
        );

        // Facturación neta
        const costosActivos = activeOrders.reduce((total, order) => {
          return (
            total +
            (order.detallePedido || []).reduce((subtotal, pedido) => {
              return subtotal + (pedido.costoBurger || 0);
            }, 0)
          );
        }, 0);
        const facturacionNeta = facturacionBruta - costosActivos;

        // Productos vendidos
        const productosVendidos = activeOrders.reduce(
          (sum, order) =>
            sum +
            (order.detallePedido ? contarProductos(order.detallePedido) : 0),
          0
        );

        // Ventas delivery y take away
        const ventasDelivery = activeOrders.filter(
          (order) => order.deliveryMethod === "delivery"
        ).length;
        const ventasTakeaway = activeOrders.filter(
          (order) => order.deliveryMethod === "takeaway"
        ).length;

        // Extra por Dynamic price
        const ordersWithPriceFactor = activeOrders.filter(
          (order) => "priceFactor" in order
        );
        const extraDynamicPrice = ordersWithPriceFactor.reduce((acc, order) => {
          const originalAmount = order.total / order.priceFactor;
          return acc + (order.total - originalAmount);
        }, 0);

        // Pedidos con extras y productos extra
        const ordersWithExtra = activeOrders.filter(
          (order) =>
            order.detallePedido &&
            Array.isArray(order.detallePedido) &&
            order.detallePedido.some((detalle) => detalle.extra === true)
        );
        const extraProducts = activeOrders.reduce((total, order) => {
          if (!order.detallePedido || !Array.isArray(order.detallePedido))
            return total;
          return (
            total +
            order.detallePedido.reduce((subTotal, producto) => {
              return producto.extra === true
                ? subTotal + producto.quantity
                : subTotal;
            }, 0)
          );
        }, 0);
        const extraFacturacion = activeOrders.reduce((total, order) => {
          if (!order.detallePedido || !Array.isArray(order.detallePedido))
            return total;
          return (
            total +
            order.detallePedido
              .filter((producto) => producto.extra)
              .reduce(
                (subtotal, producto) =>
                  subtotal + producto.priceBurger * producto.quantity,
                0
              )
          );
        }, 0);

        // Facturación cancelada
        const canceledAmount = canceledOrders.reduce(
          (sum, order) => sum + (Number(order.total) || 0),
          0
        );
        const canceledCostTotal = canceledOrders.reduce((total, order) => {
          if (!order.detallePedido || !Array.isArray(order.detallePedido))
            return total;
          return (
            total +
            order.detallePedido.reduce((subtotal, pedido) => {
              return subtotal + (pedido.costoBurger || 0);
            }, 0)
          );
        }, 0);
        const canceledNetAmount = canceledAmount - canceledCostTotal;
        const canceledProducts = canceledOrders.reduce((total, order) => {
          if (!order.detallePedido || !Array.isArray(order.detallePedido))
            return total;
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
        const canceledDelivery = canceledOrders.filter(
          (order) => order.deliveryMethod === "delivery"
        ).length;
        const canceledTakeaway = canceledOrders.filter(
          (order) => order.deliveryMethod === "takeaway"
        ).length;

        // Customer success
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
            ? 100 - (pedidosDemorados * 100) / activeOrders.length
            : 0;

        // Envío express
        const express = activeOrders.filter(
          (order) => order.envioExpress && order.envioExpress > 0
        ).length;

        // Tiempos
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

        // Km recorridos (simplificado, asume lógica en calculateKMS)
        const kmRecorridos = activeOrders.reduce((total, order) => {
          if (!order.map || order.map.length !== 2) return total;
          return total + 5; // Simplificación
        }, 0);

        // Costo promedio delivery
        const totalPaga = vueltas.reduce((totalCadetes, cadete) => {
          if (!cadete.vueltas || cadete.vueltas.length === 0)
            return totalCadetes;
          const totalCadete = cadete.vueltas.reduce((totalVueltas, vuelta) => {
            return totalVueltas + (vuelta.paga || 0);
          }, 0);
          return totalCadetes + totalCadete;
        }, 0);
        const totalDirecciones = calculateTotalDirecciones(vueltas);
        const costoKm = totalDirecciones > 0 ? totalPaga / totalDirecciones : 0;

        // Nuevos clientes (usando el cálculo corregido)
        const nuevosClientes = customersByDate[dateStr] || 0;

        // Ticket promedio
        const ticketPromedio =
          activeOrders.length > 0 ? facturacionBruta / activeOrders.length : 0;

        // Ratings
        const ratings = calculateAverageRatings(activeOrders);

        // Mapeo de ID de KPIs a las claves reales en la configuración
        const kpiMapping = {
          bruto: "bruto",
          neto: "neto",
          productos: "productos",
          delivery: "delivery",
          takeaway: "takeaway",
          priceFactor: "priceFactor",
          extraOrders: "extraOrders",
          extraProducts: "extraProducts",
          extraFacturacion: "extraFacturacion",
          canceledAmount: "canceledAmount",
          canceledNetAmount: "canceledNetAmount",
          canceledProducts: "canceledProducts",
          canceledDelivery: "canceledDelivery",
          canceledTakeaway: "canceledTakeaway",
          success: "success",
          express: "express",
          coccion: "coccion",
          entrega: "entrega",
          km: "km",
          costokm: "costokm",
          clientes: "clientes",
          ticket: "ticket",
          general: "general",
          temperatura: "temperatura",
          presentacion: "presentacion",
          pagina: "pagina",
          tiempo: "tiempo",
          "productos-rating": "productos-rating",
        };

        // Recopilar todos los valores base sin modificar
        const baseData = {
          bruto: facturacionBruta,
          neto: facturacionNeta,
          productos: productosVendidos,
          delivery: ventasDelivery,
          takeaway: ventasTakeaway,
          priceFactor: extraDynamicPrice,
          extraOrders: ordersWithExtra.length,
          extraProducts: extraProducts,
          extraFacturacion: extraFacturacion,
          canceledAmount: canceledAmount,
          canceledNetAmount: canceledNetAmount,
          canceledProducts: canceledProducts,
          canceledDelivery: canceledDelivery,
          canceledTakeaway: canceledTakeaway,
          success: customerSuccess,
          express: express,
          coccion: tiempoCoccion,
          entrega: tiempoEntregaTotal,
          km: kmRecorridos,
          costokm: costoKm,
          clientes: nuevosClientes,
          ticket: ticketPromedio,
          general: ratings.general,
          temperatura: ratings.temperatura,
          presentacion: ratings.presentacion,
          pagina: ratings.pagina,
          tiempo: ratings.tiempo,
          "productos-rating": ratings.productos,
        };

        // Aplicar modificadores utilizando la función mejorada
        const modifiedData = {};
        Object.entries(baseData).forEach(([kpiId, value]) => {
          const configKpiKey = kpiMapping[kpiId];
          const kpiData = kpiConfig[configKpiKey] || { modifiers: {} };
          const modifier = kpiData.modifiers[usuarioId] || 1;

          // Usar la función mejorada que considera rangos de fechas
          modifiedData[kpiId] = applyModifierImproved(
            value,
            modifier,
            fechaISO
          );
        });

        return {
          fecha: dateStr,
          ...modifiedData,
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
  }, [
    orders,
    neto,
    facturacionTotal,
    kpiConfig,
    kpiConfigLoaded,
    usuarioId,
    vueltas,
    telefonos,
    valueDate,
  ]);

  const allKPIOptions = [
    { id: "bruto", name: "Facturación bruta", color: "#4F46E5" },
    { id: "neto", name: "Facturación neta", color: "#818CF8" },
    { id: "productos", name: "Productos vendidos", color: "#6366F1" },
    { id: "delivery", name: "Ventas delivery", color: "#4338CA" },
    { id: "takeaway", name: "Ventas take away", color: "#A78BFA" },
    { id: "priceFactor", name: "Extra por Dynamic price", color: "#8B5CF6" },
    { id: "extraOrders", name: "Pedidos con extras", color: "#7C3AED" },
    { id: "extraProducts", name: "Productos extra", color: "#6D28D9" },
    {
      id: "extraFacturacion",
      name: "Facturación por extras",
      color: "#5B21B6",
    },
    {
      id: "canceledAmount",
      name: "Facturación bruta cancelada",
      color: "#C7D2FE",
    },
    {
      id: "canceledNetAmount",
      name: "Facturación neta cancelada",
      color: "#312E81",
    },
    { id: "canceledProducts", name: "Productos cancelados", color: "#2563EB" },
    {
      id: "canceledDelivery",
      name: "Ventas delivery canceladas",
      color: "#1D4ED8",
    },
    {
      id: "canceledTakeaway",
      name: "Ventas take away canceladas",
      color: "#1E40AF",
    },
    { id: "success", name: "Customer success", color: "#9333EA" },
    { id: "express", name: "Envío express", color: "#D946EF" },
    { id: "coccion", name: "Tiempo cocción promedio", color: "#F472B6" },
    { id: "entrega", name: "Tiempo total promedio", color: "#FBBF24" },
    { id: "km", name: "Km recorridos", color: "#F59E0B" },
    { id: "costokm", name: "Costo promedio delivery", color: "#D97706" },
    { id: "clientes", name: "Nuevos clientes", color: "#059669" },
    { id: "ticket", name: "Ticket promedio", color: "#10B981" },
    { id: "general", name: "Rating general", color: "#22D3EE" },
    { id: "temperatura", name: "Temperatura", color: "#06B6D4" },
    { id: "presentacion", name: "Presentación", color: "#0891B2" },
    { id: "pagina", name: "Página", color: "#0E7490" },
    { id: "tiempo", name: "Tiempo", color: "#155E75" },
    { id: "productos-rating", name: "Productos rating", color: "#047857" },
  ];

  useEffect(() => {
    if (!kpiConfigLoaded) return;

    const filteredKPIs = allKPIOptions.filter((kpi) =>
      hasKpiPermission(kpi.id, kpiConfig, usuarioId)
    );

    setAvailableKPIs(filteredKPIs);

    // Seleccionar inicialmente TODOS los KPIs disponibles
    setSelectedKPIs(filteredKPIs.map((kpi) => kpi.id));
  }, [kpiConfigLoaded, kpiConfig, usuarioId]);

  const toggleKPI = (kpiId) => {
    setSelectedKPIs((prev) =>
      prev.includes(kpiId)
        ? prev.filter((id) => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  if (!kpiConfigLoaded) {
    return (
      <div className="bg-gray-100 mt-4 pt-4 rounded-lg shadow-2xl shadow-gray-400 mb-4 pb-2 h-[250px] flex items-center justify-center">
        <p className="text-gray-400 ">Cargando gráficos...</p>
      </div>
    );
  }

  if (availableKPIs.length === 0) {
    return (
      <div className="bg-white mt-4 pt-4 rounded-lg shadow-2xl shadow-gray-400 mb-4 pb-2 h-[250px] flex items-center justify-center">
        <p className="text-gray-400  px-8 text-center">
          No hay gráficos disponibles con tus permisos actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 mt-4 pt-4 rounded-lg shadow-2xl shadow-gray-400 mb-4 pb-2">
      <div className="md:pt-4">
        <p className="md:text-5xl text-2xl font-bold pb-4 mt-2 text-center border-b border-gray-200">
          Métricas en el tiempo
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
        <div className="text-center text-xs text-gray-500 mb-2">
          {selectedKPIs.length === 0
            ? "Selecciona métricas para visualizar"
            : `Mostrando ${selectedKPIs.length} ${selectedKPIs.length === 1 ? "métrica" : "métricas"}`}
        </div>
      </div>
      {chartData.length > 0 ? (
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
                    if (name === "success") return `${value.toFixed(1)}%`;
                    if (name === "coccion" || name === "entrega")
                      return `${value.toFixed(1)} min`;
                    if (name === "km") return `${value.toFixed(1)} km`;
                    if (
                      name === "bruto" ||
                      name === "neto" ||
                      name === "priceFactor" ||
                      name === "extraFacturacion" ||
                      name === "canceledAmount" ||
                      name === "canceledNetAmount" ||
                      name === "costokm" ||
                      name === "ticket"
                    )
                      return `${value.toFixed(0)}`;
                    if (
                      name === "general" ||
                      name === "temperatura" ||
                      name === "presentacion" ||
                      name === "pagina" ||
                      name === "tiempo" ||
                      name === "productos-rating"
                    )
                      return `${value.toFixed(1)}/5`;
                    return value.toFixed(0);
                  }
                  return value;
                }}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              {availableKPIs.map(
                (kpi) =>
                  selectedKPIs.includes(kpi.id) && (
                    <Bar
                      key={kpi.id}
                      dataKey={kpi.id}
                      name={kpi.name}
                      fill={kpi.color}
                      barSize={20}
                    />
                  )
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-400 text-center px-8 font-light">
          No hay datos disponibles para el período seleccionado
        </p>
      )}
    </div>
  );
};

export default KPILineChart;
