import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { CardInfo } from "../components/dashboard";
import { projectAuth } from "../firebase/config";
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
import Swal from "sweetalert2";
import { Cadete, PedidoProps } from "../types/types"; // Importa PedidoProps
import KPILineChart from "../components/dashboard/KPILineChart";
import { EmpresaProps, EmpleadoProps } from "../firebase/ClientesAbsolute";

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

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch();

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
  const currentUserEmail = projectAuth.currentUser?.email;
  const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

  // Calculate delivery and takeaway counts
  const deliveryCount = orders.filter(
    (order) => order.deliveryMethod === "delivery" && !order.canceled
  ).length;

  const takeawayCount = orders.filter(
    (order) => order.deliveryMethod === "takeaway" && !order.canceled
  ).length;

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
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error al traer datos: ${error.message || error}`,
        });
      }
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

  const ratingCards = [
    <CardInfo
      key="general"
      info={averageRatings.general.average}
      title={"Rating general"}
      cuadrito={averageRatings.general.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="temperatura"
      info={averageRatings.temperatura.average}
      title={"Temperatura"}
      cuadrito={averageRatings.temperatura.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="presentacion"
      info={averageRatings.presentacion.average}
      title={"Presentación"}
      cuadrito={averageRatings.presentacion.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="pagina"
      info={averageRatings.pagina.average}
      title={"Página"}
      cuadrito={averageRatings.pagina.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="tiempo"
      info={averageRatings.tiempo.average}
      title={"Tiempo"}
      cuadrito={averageRatings.tiempo.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="productos"
      info={averageRatings.productos.average}
      title={"Productos"}
      cuadrito={averageRatings.productos.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
  ];

  const marketingCards = [
    <CardInfo
      key="productos"
      info={Math.ceil(totalProductosVendidos.toString() * 2)}
      link={"productosVendidos"}
      title={"Productos vendidos"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="delivery"
      info={Math.ceil(orders.length.toString() * 2)}
      link={"ventas"}
      title={"Ventas delivery"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="clientes"
      info={Math.ceil(customers.newCustomers.length.toString() * 1.5)}
      link={"clientes"}
      title={"Nuevos clientes"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="presentacion"
      info={averageRatings.presentacion.average}
      title={"Presentación"}
      cuadrito={averageRatings.presentacion.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="pagina"
      info={averageRatings.pagina.average}
      title={"Página"}
      cuadrito={averageRatings.pagina.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
  ];

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

  const allCards = [
    <CardInfo
      key="bruto"
      info={currencyFormat(Math.ceil(facturacionTotal))}
      link={"bruto"}
      title={"Facturación bruta"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="neto"
      info={currencyFormat(Math.ceil(neto))}
      link={"neto"}
      cuadrito={facturacionTotal > 0 ? (neto * 100) / facturacionTotal : 0}
      title={"Facturación neta"}
      isLoading={isLoading}
    />,

    <CardInfo
      key="productos"
      info={totalProductosVendidos.toString()}
      link={"productosVendidos"}
      title={"Productos vendidos"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="delivery"
      info={deliveryCount.toString()}
      link={"ventas"}
      title={"Ventas delivery"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="takeaway"
      info={takeawayCount.toString()}
      link={"ventas"}
      title={"Ventas take away"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="priceFactor"
      info={(() => {
        const ordersWithPriceFactor = orders.filter(
          (order) => "priceFactor" in order
        );
        const extraAmount = ordersWithPriceFactor.reduce((acc, order) => {
          const originalAmount = order.total / order.priceFactor;
          return acc + (order.total - originalAmount);
        }, 0);

        const totalOriginalAmount = facturacionTotal - extraAmount;
        const originalPercentage =
          (totalOriginalAmount * 100) / facturacionTotal;

        return currencyFormat(Math.ceil(extraAmount));
      })()}
      title={"Extra por Dynamic price"}
      cuadrito={
        facturacionTotal > 0
          ? 100 -
            ((facturacionTotal -
              orders
                .filter((order) => "priceFactor" in order)
                .reduce((acc, order) => {
                  const originalAmount = order.total / order.priceFactor;
                  return acc + (order.total - originalAmount);
                }, 0)) *
              100) /
              facturacionTotal
          : 0
      }
      isLoading={isLoading}
    />,

    <CardInfo
      key="extraOrders"
      info={ordersWithExtra.length.toString()} // Muestra el número total de pedidos con 'extra: true'
      title={"Pedidos con extras al final "} // Título del card
      isLoading={isLoading} // Muestra un indicador de carga si es necesario
      cuadrito={
        facturacionTotal > 0
          ? (ordersWithExtra.length * 100) / (deliveryCount + takeawayCount)
          : 0
      }
    />,
    <CardInfo
      key="extraProducts"
      info={extraProductsCount.toString()} // Total de productos con 'extra: true'
      title={"Productos extra al final"} // Título del card
      isLoading={isLoading} // Indicador de carga
    />,
    <CardInfo
      key="extraFacturacion"
      info={currencyFormat(
        orders.reduce((total, order) => {
          if (!order.detallePedido || !Array.isArray(order.detallePedido)) {
            return total;
          }
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
        }, 0)
      )}
      title={"Facturación por extras"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="canceledAmount"
      info={currencyFormat(Math.round(canceledOrdersTotal))}
      title={"Facturación bruta cancelada"}
      isLoading={isLoading}
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
    />,
    <CardInfo
      key="canceledProducts"
      info={canceledProducts.toString()}
      title={"Productos cancelados"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="canceledDelivery"
      info={canceledDeliveryOrders.length.toString()}
      title={"Ventas delivery canceladas"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="canceledTakeaway"
      info={canceledTakeawayOrders.length.toString()}
      title={"Ventas take away canceladas"}
      isLoading={isLoading}
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
    />,
    <CardInfo
      key="coccion"
      info={`${Math.round(calcularPromedioTiempoElaboracion(orders))} M`}
      title={"Tiempo cocción promedio"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="entrega"
      info={`${Math.round(promedioTiempoDeEntregaTotal(orders))} M`}
      title={"Tiempo total promedio"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="km"
      info={`${Math.round(calculateKMS(orders))} km`}
      title={"Km recorridos"}
      isLoading={isLoading}
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
    />,
    <CardInfo
      key="clientes"
      info={customers.newCustomers.length.toString()}
      link={"clientes"}
      title={"Nuevos clientes"}
      isLoading={isLoading}
    />,
    <CardInfo
      key="ticket"
      info={
        orders.length > 0
          ? currencyFormat(Math.round(facturacionTotal / orders.length))
          : currencyFormat(0)
      }
      title={"Ticket promedio"}
      isLoading={isLoading}
    />,
  ];

  const cardsToRender = isMarketingUser
    ? marketingCards
    : [...allCards, ...ratingCards];

  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;
  const nombreUsuario =
    tipoUsuario === "empresa"
      ? (auth?.usuario as EmpresaProps)?.datosUsuario?.nombreUsuario || ""
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.datos?.nombre || ""
        : "";

  const greetingName = nombreUsuario;

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
        <p className="text-white text-5xl mt-8 font-bold mb-4">
          Hola {greetingName}
        </p>
      </div>
      <div className="absolute left-4 right-4 top-[130px] rounded-lg">
        <div className="flex flex-col shadow-2xl shadow-gray-400 rounded-lg">
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
        </div>
        <KPILineChart orders={orders} />
      </div>
    </div>
  );
};
