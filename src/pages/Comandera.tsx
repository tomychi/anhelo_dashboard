import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { ReadOrdersForToday } from '../firebase/ReadData';
import { PedidoProps } from '../types/types';
import { RootState } from '../redux/configureStore';
import { useSelector, useDispatch } from 'react-redux';
import { readOrdersData } from '../redux/data/dataAction';

export const Comandera = () => {
  const [seccionActiva, setSeccionActiva] = useState('porHacer');
  const [cadeteSeleccionado, setCadeteSeleccionado] = useState('');

  const disptach = useDispatch();
  const { orders } = useSelector((state: RootState) => state.data);

  useEffect(() => {
    const unsubscribe = ReadOrdersForToday((pedidos: PedidoProps[]) => {
      disptach(readOrdersData(pedidos));
    });

    return () => {
      unsubscribe(); // Detiene la suscripción cuando el componente se desmonta
    };
  }, [disptach]);

  // Filtra los pedidos según la sección activa
  const pedidosPorHacer = orders.filter(
    (o) =>
      !o.elaborado && (!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
  );
  const pedidosHechos = orders.filter(
    (o) =>
      o.elaborado && (!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
  );

  const cadetesUnicos = Array.from(
    new Set(orders.map((order) => order.cadete))
  );

  // Manejar el cambio en el select de cadetes
  const handleCadeteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoCadeteSeleccionado = event.target.value;
    setCadeteSeleccionado(nuevoCadeteSeleccionado);
  };

  return (
    <div>
      <div className="flex justify-center font-antonio my-4">
        <select value={cadeteSeleccionado} onChange={handleCadeteChange}>
          <option value="">Todos los cadetes</option>
          {cadetesUnicos.map((cadete, index) => (
            <option key={index} value={cadete}>
              {cadete}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-center font-antonio my-4">
        <button
          className={`mx-2 py-2 px-4 ${
            seccionActiva === 'porHacer'
              ? 'bg-custom-red'
              : 'border-2 border-red-main text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('porHacer')}
        >
          Por Hacer
        </button>
        <button
          className={`mx-2 py-2 px-4 ${
            seccionActiva === 'hechos'
              ? 'bg-custom-red'
              : 'border-2 border-red-main text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('hechos')}
        >
          Hechos
        </button>
      </div>
      <div className="grid grid-cols-2 p-4 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
        {seccionActiva === 'porHacer' ? (
          Array.isArray(pedidosPorHacer) && pedidosPorHacer.length > 0 ? (
            pedidosPorHacer.map((comanda) => (
              <div key={comanda.id}>
                <Card comanda={comanda} />
              </div>
            ))
          ) : (
            <p className="text-custom-red font-antonio p-4">
              No hay pedidos por hacer.
            </p>
          )
        ) : Array.isArray(pedidosHechos) && pedidosHechos.length > 0 ? (
          pedidosHechos.map((comanda) => (
            <div key={comanda.id}>
              <Card comanda={comanda} />
            </div>
          ))
        ) : (
          <p className="text-custom-red font-antonio p-4">
            No hay pedidos hechos.
          </p>
        )}
      </div>
    </div>
  );
};
