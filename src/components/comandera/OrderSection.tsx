import { PedidoProps } from '../../types/types';
import { CardComanda } from './Card/CardComanda';

interface OrderSectionProps {
  orders: PedidoProps[];
}

export const OrderSection: React.FC<OrderSectionProps> = ({ orders }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {orders.map((comanda) => (
        <div key={comanda.id}>
          <CardComanda comanda={comanda} />
        </div>
      ))}
    </div>
  );
};
