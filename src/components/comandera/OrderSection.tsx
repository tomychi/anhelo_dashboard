import { PedidoProps } from '../../types/types';
import { Card } from './Card';

interface OrderSectionProps {
  orders: PedidoProps[];
}

export const OrderSection: React.FC<OrderSectionProps> = ({ orders }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {orders.map((comanda) => (
        <div key={comanda.id}>
          <Card comanda={comanda} />
        </div>
      ))}
    </div>
  );
};
