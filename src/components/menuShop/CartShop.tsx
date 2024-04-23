import { DetallePedidoProps } from '../../pages/DynamicForm';
import currencyFormat from '../../helpers/currencyFormat';
export const CartShop = ({
  detallePedido,
  limpiarDetallePedido,
}: {
  detallePedido: DetallePedidoProps[];
  limpiarDetallePedido: () => void;
}) => {
  const total = detallePedido.reduce((acc, d) => acc + (d.subTotal || 0), 0);

  return (
    <div className="flex flex-col w-full font-antonio justify-center  bg-custom-red ">
      <div className="flex flex-row p-4  w-full justify-between">
        <h5 className=" text-6xl mt-[-0.5rem] font-black">
          CARRITO {currencyFormat(total)}
        </h5>

        <svg
          onClick={limpiarDetallePedido}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-10 h-10  border-2 border-black p-2 cursor-pointer"
        >
          <path
            fillRule="evenodd"
            d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <hr className=" border-t-2 w-full border-black" />
      {detallePedido.length > 0 ? (
        <div className="grid  grid-cols-6 p-4 p  gap-4 ">
          {detallePedido.map((p, index) => (
            <div className="" key={index}>
              <h3 className="text-sm bg-black p-4  text-custom-red  font-black uppercase ">
                {p.quantity}x {p.burger}
                {p.toppings?.map((t, i) => (
                  <div key={i}>: {t}</div>
                ))}
                : {currencyFormat(p.subTotal)}
              </h3>
            </div>
          ))}
        </div>
      ) : (
        <h2 className="p-4 text-left w-full">El carrito esta vacio.</h2>
      )}
    </div>
  );
};
