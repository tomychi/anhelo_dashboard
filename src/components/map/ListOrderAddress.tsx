import { useSelector } from 'react-redux';
import { RootState } from '../../redux/configureStore';

export const ListOrderAddress = () => {
  const { orders } = useSelector((state: RootState) => state.data);
  return (
    <div className="relative">
      <div
        className="absolute top-4 left-4 w-60 bg-white rounded-lg shadow-md p-1 overflow-y-auto"
        style={{ zIndex: 999 }}
      >
        <h2 className="text-lg font-semibold mb-4">Direcciones de Pedidos</h2>
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-blue-500 text-white border border-gray-200 py-2 px-4 mb-2 flex justify-between items-center rounded"
          >
            <h3>{order.direccion}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};
