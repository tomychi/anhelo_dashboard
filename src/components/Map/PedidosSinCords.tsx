import { PedidoProps } from '../../types/types';

interface PedidosSinCordsProps {
  pedidos: PedidoProps[];
  setClickMap: (value: { value: boolean; id: string; fecha: string }) => void;
}

export const PedidosSinCords = ({
  pedidos,
  setClickMap,
}: PedidosSinCordsProps) => {
  return (
    <div className="mt-4 overflow-x-auto whitespace-nowrap">
      {pedidos.map((pedido) => (
        <div
          key={pedido.id}
          className="inline-block w-64 p-4 mx-2 bg-white rounded-lg shadow-md"
        >
          <p className="font-bold">{pedido.direccion}</p>
          <button
            onClick={() =>
              setClickMap({ value: true, id: pedido.id, fecha: pedido.fecha })
            }
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md block w-full mt-2"
          >
            Cambiar coordenadas
          </button>
        </div>
      ))}
    </div>
  );
};
