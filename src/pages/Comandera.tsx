import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../redux/slices/orders/ordersAction';

export const Comandera = () => {
  const [seccionActiva, setSeccionActiva] = useState('porHacer');
  const dispatch = useDispatch();
  const { orders } = useSelector((state: any) => state.ordersState);
  useEffect(() => {
    if (!orders.length) {
      dispatch(fetchOrders());
    }
  }, [orders, dispatch]);

  // Filtra los pedidos según la sección activa
  const pedidosPorHacer = orders.filter(({ data }) => !data.elaborado);
  const pedidosHechos = orders.filter(({ data }) => data.elaborado);

  return (
    <div>
      <div className="flex justify-center font-antonio  my-4">
        <button
          className={`mx-2 py-2 px-4 ${
            seccionActiva === 'porHacer'
              ? 'bg-custom-red'
              : 'border border-red-700 text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('porHacer')}
        >
          Por Hacer
        </button>
        <button
          className={`mx-2 py-2 px-4 ${
            seccionActiva === 'hechos'
              ? 'bg-custom-red'
              : 'border border-red-700 text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('hechos')}
        >
          Hechos
        </button>
      </div>
      <div className="grid grid-cols-2 p-4 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
        {seccionActiva === 'porHacer' ? (
          Array.isArray(pedidosPorHacer) && pedidosPorHacer.length > 0 ? (
            pedidosPorHacer.map((comanda, i) => (
              <Card key={i} comanda={comanda} />
            ))
          ) : (
            <p className="text-custom-red font-antonio p-4">
              No hay pedidos por hacer.
            </p>
          )
        ) : Array.isArray(pedidosHechos) && pedidosHechos.length > 0 ? (
          pedidosHechos.map((comanda, i) => <Card key={i} comanda={comanda} />)
        ) : (
          <p className="text-custom-red font-antonio p-4">
            No hay pedidos hechos.
          </p>
        )}
      </div>
    </div>
  );
};
