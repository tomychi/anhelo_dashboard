import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { ReadOrdersForToday } from '../firebase/ReadData';
import { ComandaProps } from '../types/types';

export const Comandera = () => {
  const [seccionActiva, setSeccionActiva] = useState('porHacer');
  const [pedidosHoy, setPedidosHoy] = useState<ComandaProps[]>([]);

  useEffect(() => {
    const unsubscribe = ReadOrdersForToday((pedidos: ComandaProps[]) => {
      setPedidosHoy(pedidos);
    });

    return () => {
      unsubscribe(); // Detiene la suscripción cuando el componente se desmonta
    };
  }, []);

  useEffect(() => {
    // Ordenar los pedidos filtrados por hora
    pedidosHoy.sort((a, b) => {
      const horaA = new Date(`2023-12-11 ${a.data.hora}`);
      const horaB = new Date(`2023-12-11 ${b.data.hora}`);
      return horaA.getTime() - horaB.getTime();
    });
    // Realizar otras operaciones con pedidosHoy después de la actualización
  }, [pedidosHoy]);

  // Filtra los pedidos según la sección activa
  const pedidosPorHacer = pedidosHoy.filter(({ data }) => !data.elaborado);
  const pedidosHechos = pedidosHoy.filter(({ data }) => data.elaborado);

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
              <div key={i}>
                <Card comanda={comanda} />
              </div>
            ))
          ) : (
            <p className="text-custom-red font-antonio p-4">
              No hay pedidos por hacer.
            </p>
          )
        ) : Array.isArray(pedidosHechos) && pedidosHechos.length > 0 ? (
          pedidosHechos.map((comanda, i) => (
            <div key={i}>
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
