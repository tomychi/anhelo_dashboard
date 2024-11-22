// ../components/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import currencyFormat from '../helpers/currencyFormat';
import Calendar from '../components/Calendar';
import { CardInfo } from '../components/dashboard';
import { projectAuth } from '../firebase/config';
import { getCustomers } from '../helpers/orderByweeks';
import { calculateKMS } from '../helpers';
import {
  calcularPromedioTiempoElaboracion,
  promedioTiempoDeEntregaTotal,
  contarPedidosDemorados,
} from '../helpers/dateToday';
import { ReadMateriales } from '../firebase/Materiales';
import { readMaterialsAll } from '../redux/materials/materialAction';
import { readProductsAll } from '../redux/products/productAction';
import { ReadData } from '../firebase/ReadData';
import { calcularCostoHamburguesa } from '../helpers/calculator';
import { ProductStateProps } from '../redux/products/productReducer';
import Swal from 'sweetalert2';
import { Cadete, PedidoProps } from '../types/types'; // Importa PedidoProps
import KPILineChart from '../components/dashboard/KPILineChart';

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
  const isMarketingUser = currentUserEmail === 'marketing@anhelo.com';

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
          icon: 'error',
          title: 'Error',
          text: `Error al traer datos: ${error.message || error}`,
        });
      }
    };

    fetchData();
  }, [dispatch]);

  // Efecto para actualizar ratings y mostrar log
  useEffect(() => {
    const logBurgersRatings = async () => {
      try {
        // Primero actualizamos los ratings
        await updateBurgersRatings(orders);

        // Luego obtenemos los datos actualizados
        const allProducts = await ReadData();
        const burgers = allProducts.filter(
          (product) => product.collectionName === 'burgers'
        );

        // Obtener calificaciones de los pedidos
        const productRatings: { [key: string]: number[] } = {};

        orders.forEach((order) => {
          if (order.rating) {
            order.detallePedido.forEach((item) => {
              const productName = item.burger;
              const rating = order.rating?.[productName];

              if (typeof rating === 'number') {
                if (!productRatings[productName]) {
                  productRatings[productName] = [];
                }
                productRatings[productName].push(rating);
              }
            });
          }
        });

        // Mostrar información para cada burger
        burgers.forEach((burger) => {
          const burgerName = burger.data.name;
          const ratings = productRatings[burgerName] || [];
          const averageRating =
            ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length
              : 0;

          console.log(`Burger: ${burgerName}`);
          console.log(`├── ID: ${burger.id}`);
          console.log(`├── Precio: $${burger.data.price}`);
          console.log(`├── Tipo: ${burger.data.type}`);
          console.log(`├── Rating en Firebase: ${burger.data.rating || 0}`);
          console.log(`├── Calificaciones de clientes: ${ratings.length}`);
          console.log(
            `├── Promedio de calificaciones: ${averageRating.toFixed(1)}`
          );
          console.log(
            `├── Todas las calificaciones: ${
              ratings.length > 0 ? ratings.join(', ') : 'Sin calificaciones'
            }`
          );
          console.log(
            `└── Ingredientes: ${Object.keys(
              burger.data.ingredients || {}
            ).join(', ')}`
          );
          console.log('-----------------------------------');
        });
      } catch (error) {
        console.error('Error al obtener las burgers:', error);
      }
    };

    logBurgersRatings();
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
        typeof order.rating === 'object' &&
        Object.keys(order.rating).length > 0
    );

    const generalRatings = ['presentacion', 'tiempo', 'temperatura', 'pagina'];
    const initialTotals: { [key: string]: { sum: number; count: number } } = {
      general: { sum: 0, count: 0 },
      temperatura: { sum: 0, count: 0 },
      presentacion: { sum: 0, count: 0 },
      pagina: { sum: 0, count: 0 },
      tiempo: { sum: 0, count: 0 },
      productos: { sum: 0, count: 0 },
    };

    const totals = ordersWithRatings.reduce((acc, order) => {
      if (order.rating && typeof order.rating === 'object') {
        Object.entries(order.rating).forEach(([key, value]) => {
          if (typeof value === 'number') {
            const lowerKey = key.toLowerCase();
            if (!generalRatings.includes(lowerKey)) {
              acc['productos'].sum += value;
              acc['productos'].count += 1;
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
      title={'Rating general'}
      cuadrito={averageRatings.general.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="temperatura"
      info={averageRatings.temperatura.average}
      title={'Temperatura'}
      cuadrito={averageRatings.temperatura.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="presentacion"
      info={averageRatings.presentacion.average}
      title={'Presentación'}
      cuadrito={averageRatings.presentacion.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="pagina"
      info={averageRatings.pagina.average}
      title={'Página'}
      cuadrito={averageRatings.pagina.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="tiempo"
      info={averageRatings.tiempo.average}
      title={'Tiempo'}
      cuadrito={averageRatings.tiempo.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
    <CardInfo
      key="productos"
      info={averageRatings.productos.average}
      title={'Productos'}
      cuadrito={averageRatings.productos.count}
      showAsRatings={true}
      isLoading={isLoading}
    />,
  ];

  const marketingCards = [
    <CardInfo
      key="visualizacion"
      info="0"
      title={'Visualización local'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="seguidores"
      info="0"
      title={'Nuevos seguidores'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="likes"
      info="0"
      title={'Promedio de likes'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="comentarios"
      info="0"
      title={'Promedio de comentarios'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="compartidos"
      info="0"
      title={'Promedio de compartidos'}
      isLoading={isLoading}
    />,
  ];

  const allCards = [
    <CardInfo
      key="bruto"
      info={currencyFormat(facturacionTotal)}
      link={'bruto'}
      title={'Facturación bruta'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="neto"
      info={currencyFormat(Math.ceil(neto))}
      link={'neto'}
      cuadrito={facturacionTotal > 0 ? (neto * 100) / facturacionTotal : 0}
      title={'Facturación neta'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="productos"
      info={totalProductosVendidos.toString()}
      link={'productosVendidos'}
      title={'Productos vendidos'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="delivery"
      info={orders.length.toString()}
      link={'ventas'}
      title={'Ventas delivery'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="takeaway"
      info="-"
      link={'ventas'}
      title={'Ventas take away'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="success"
      info={`${Math.ceil(
        orders.length > 0
          ? 100 - (contarPedidosDemorados(orders) * 100) / orders.length
          : 0
      )}%`}
      title={'Customer success'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="coccion"
      info={`${Math.round(calcularPromedioTiempoElaboracion(orders))} M`}
      title={'Tiempo cocción promedio'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="entrega"
      info={`${Math.round(promedioTiempoDeEntregaTotal(orders))} M`}
      title={'Tiempo total promedio'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="km"
      info={`${Math.round(calculateKMS(orders))} km`}
      title={'Km recorridos'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="costokm"
      info={currencyFormat(
        orders.length > 0 && totalDirecciones > 0
          ? totalPaga / totalDirecciones
          : 0
      )}
      title={'Costo promedio delivery'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="clientes"
      info={customers.newCustomers.length.toString()}
      link={'clientes'}
      title={'Nuevos clientes'}
      isLoading={isLoading}
    />,
    <CardInfo
      key="ticket"
      info={
        orders.length > 0
          ? currencyFormat(facturacionTotal / orders.length)
          : currencyFormat(0)
      }
      title={'Ticket promedio'}
      isLoading={isLoading}
    />,
  ];

  const cardsToRender = isMarketingUser
    ? [...ratingCards]
    : [...allCards, ...ratingCards];

  const greetingName = isMarketingUser ? 'Lucho' : 'Tobias';

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
        <div className="flex flex-col shadow-2xl shadow-black rounded-lg">
          {cardsToRender.map((card, index) =>
            React.cloneElement(card, {
              key: index,
              className: `
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === cardsToRender.length - 1 ? 'rounded-b-lg' : ''}
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
