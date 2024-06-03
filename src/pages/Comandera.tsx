// PAGINA ORIENTADA A DAR CONCIENCIA DE LA VELOCIDAD

import { useEffect, useState } from 'react';
import { ReadOrdersForToday } from '../firebase/ReadData';
import { PedidoProps } from '../types/types';
import { RootState } from '../redux/configureStore';
import { useSelector, useDispatch } from 'react-redux';
import { readOrdersData } from '../redux/data/dataAction';
import { useLocation } from 'react-router-dom';
import { GeneralStats, OrderList, Vueltas } from '../components/comandera';
import { NavButtons } from '../components/comandera/NavButtons';
import DeliveryMap from './DeliveryMap';
import { buscarCoordenadas } from '../apis/getCoords';
import { handleAddressSave } from '../firebase/UploadOrder';
import CadeteSelect from '../components/Cadet/CadeteSelect';
import { EmpleadosProps, readEmpleados } from '../firebase/registroEmpleados';
import { obtenerFechaActual } from '../helpers/dateToday';
import { VueltaInfo, obtenerVueltasCadete } from '../firebase/Cadetes';

function formatearFecha(fechaStr: string | Date) {
  const fecha = new Date(fechaStr);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export const Comandera = () => {
  const [seccionActiva, setSeccionActiva] = useState('porHacer');
  const dispatch = useDispatch();
  const [sumaTotalPedidos, setSumaTotalPedidos] = useState(0);
  const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState(0);
  const [selectedCadete, setSelectedCadete] = useState<string | null>(null);

  const [cadetes, setCadetes] = useState<string[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);
  const [vueltas, setVueltas] = useState<VueltaInfo[]>([]);

  const { orders } = useSelector((state: RootState) => state.data);
  const { valueDate } = useSelector((state: RootState) => state.data);

  const location = useLocation();
  // Filtrar y ordenar los pedidos una vez
  const filteredOrders = orders
    .filter((o) => !selectedCadete || o.cadete === selectedCadete)
    .sort((a, b) => {
      const [horaA, minutosA] = a.hora.split(':').map(Number);
      const [horaB, minutosB] = b.hora.split(':').map(Number);
      return horaA * 60 + minutosA - (horaB * 60 + minutosB);
    });

  // Dividir los pedidos filtrados en las diferentes categorías
  const pedidosPorHacer = filteredOrders.filter(
    (o) => !o.elaborado && !o.entregado
  );
  const pedidosHechos = filteredOrders.filter(
    (o) => o.elaborado && !o.entregado
  );
  const pedidosEntregados = filteredOrders.filter((o) => o.entregado);

  useEffect(() => {
    const obtenerCadetes = async () => {
      try {
        const empleados = await readEmpleados();

        setEmpleados(empleados);

        const cadetesFiltrados = empleados
          .filter((empleado) => empleado.category === 'cadete')
          .map((empleado) => empleado.name);
        setCadetes(cadetesFiltrados);
      } catch (error) {
        console.error('Error al obtener los cadetes:', error);
      }
    };

    obtenerCadetes();

    if (location.pathname === '/comandas') {
      const unsubscribe = ReadOrdersForToday(async (pedidos: PedidoProps[]) => {
        // pedidos que no tengan la prop map se les asigna un valor
        const pedidosSinMap = pedidos.filter(
          (pedido) => !pedido.map || pedido.map[0] === 0 || pedido.map[1] === 0
        );

        // ahora con la funcion buscarCoordenadas se le asigna un valor a la propiedad map
        for (const pedido of pedidosSinMap) {
          const coordenadas = await buscarCoordenadas(pedido.direccion);
          if (coordenadas) {
            await handleAddressSave(pedido.fecha, pedido.id, coordenadas);
          }
        }
        dispatch(readOrdersData(pedidos));
      });

      return () => {
        unsubscribe(); // Detiene la suscripción cuando el componente se desmonta
      };
    }
  }, [dispatch, location]);

  // Manejar el cambio en el select de cadetes
  const handleCadeteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoCadeteSeleccionado = event.target.value;

    if (nuevoCadeteSeleccionado === '') {
      setSelectedCadete(null);
      setVueltas([]);
      return;
    }

    if (location.pathname === '/comandas') {
      obtenerVueltasCadete(nuevoCadeteSeleccionado, obtenerFechaActual())
        .then((vueltas) => {
          setVueltas(vueltas);
        })
        .catch((error) => {
          console.error('Error al obtener las vueltas del cadete:', error);
        });
    } else {
      const fecha = valueDate?.startDate
        ? formatearFecha(valueDate.startDate)
        : obtenerFechaActual();

      console.log(fecha);
      console.log(obtenerFechaActual());
      obtenerVueltasCadete(nuevoCadeteSeleccionado, fecha)
        .then((vueltas) => {
          setVueltas(vueltas);
        })
        .catch((error) => {
          console.error('Error al obtener las vueltas del cadete:', error);
        });
    }

    setSelectedCadete(nuevoCadeteSeleccionado);

    // Calcular la suma total de pedidos para el cadete seleccionado
    const totalPedidosCadete = orders.reduce((total, pedido) => {
      if (pedido.cadete === nuevoCadeteSeleccionado) {
        return total + 1; // Si no se ha seleccionado ningún cadete o si el cadete del pedido coincide con el seleccionado, sumar 1 al total
      } else {
        return total;
      }
    }, 0);

    setSumaTotalPedidos(totalPedidosCadete);

    // Calcular la suma total de los montos de los pedidos que fueron en efectivo para el cadete seleccionado
    const totalEfectivoCadete = orders.reduce((total, pedido) => {
      if (
        pedido.cadete === nuevoCadeteSeleccionado &&
        pedido.metodoPago === 'efectivo'
      ) {
        return total + pedido.total; // Si no se ha seleccionado ningún cadete o si el cadete del pedido coincide con el seleccionado y el pago fue en efectivo, sumar el monto total del pedido
      } else {
        return total;
      }
    }, 0);

    setSumaTotalEfectivo(totalEfectivoCadete);
  };

  const customerSuccess =
    100 -
    (orders.filter((order) => order.dislike || order.delay).length * 100) /
      orders.length;

  return (
    <div className=" p-4 flex flex-col">
      <NavButtons
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
      />
      <div className="row-start-4">
        <CadeteSelect
          vueltas={vueltas}
          cadetes={cadetes}
          handleCadeteChange={handleCadeteChange}
          selectedCadete={selectedCadete}
          orders={pedidosHechos}
          setVueltas={setVueltas}
        />{' '}
        {seccionActiva !== 'mapa' && (
          <>
            <GeneralStats
              customerSuccess={customerSuccess}
              orders={orders}
              cadeteSeleccionado={selectedCadete}
              sumaTotalPedidos={sumaTotalPedidos}
              sumaTotalEfectivo={sumaTotalEfectivo}
              empleados={empleados}
            />
            <OrderList
              seccionActiva={seccionActiva}
              pedidosPorHacer={pedidosPorHacer}
              pedidosHechos={pedidosHechos}
              pedidosEntregados={
                seccionActiva !== 'mapa' ? pedidosEntregados : []
              }
              cadetes={cadetes}
            />
          </>
        )}
      </div>
      <div className="mt-2">
        {seccionActiva === 'mapa' &&
          (location.pathname === '/comandas' ? (
            // <MapsApp orders={[...pedidosHechos, ...pedidosPorHacer]} />
            <DeliveryMap
              orders={[...pedidosHechos, ...pedidosPorHacer]}
              selectedCadete={selectedCadete}
              cadetes={cadetes}
            />
          ) : (
            <DeliveryMap
              orders={orders}
              selectedCadete={selectedCadete}
              cadetes={cadetes}
            />
          ))}
      </div>

      <div className="flex flex-col">
        {seccionActiva === 'vueltas' && (
          <Vueltas cadete={selectedCadete} vueltas={vueltas} />
        )}
      </div>

      {/* Esto es para la contabilidad, NO BORRAR */}
      {/* <button
				className="bg-white"
				onClick={() => {
					const direcciones = OrdersSinRotadores.map(
						(order) => order.direccion
					);
					navigator.clipboard.writeText(direcciones.join("\n"));
				}}
			>
				Copiar Direcciones
			</button> */}
    </div>
  );
};
