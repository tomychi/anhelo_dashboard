import { DetallePedidoProps } from '../../pages/DynamicForm';

export const CartShop = ({
  detallePedido,
}: {
  detallePedido: DetallePedidoProps[];
}) => {
  console.log(detallePedido);
  return (
    <div className="bg-green-500">
      {detallePedido.map((p) => (
        <div>
          <h3 key={p.burger} className="text-3xl font-semibold">
            {p.quantity}x{p.burger}
            <br />
          </h3>
          {p.toppings?.map((t) => (
            <div>
              <b>-{t}</b>
              <br />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
