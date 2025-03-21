import { useState, useEffect } from "react";
import { DetallePedidoProps } from "../../pages/DynamicForm";
import currencyFormat from "../../helpers/currencyFormat";
import editIcon from "../../assets/editIcon.png";

export const CartShop = ({
  detallePedido,
  limpiarDetallePedido,
  onTotalChange,
  onRemoveItem, // Nueva prop para manejar la eliminación de ítems individuales
}: {
  detallePedido: DetallePedidoProps[];
  limpiarDetallePedido: () => void;
  onTotalChange: (newTotal: number) => void;
  onRemoveItem: (index: number) => void; // Tipo de la nueva prop
}) => {
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [editableTotal, setEditableTotal] = useState(0);

  const total = detallePedido.reduce((acc, d) => acc + (d.subTotal || 0), 0);

  useEffect(() => {
    setEditableTotal(total);
  }, [total]);

  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const capitalizeBurgerName = (name: string): string => {
    return name.split(" ").map(capitalizeFirstLetter).join(" ");
  };

  const formatToppings = (toppings: string[]): string => {
    const capitalizedToppings = toppings.map(capitalizeFirstLetter);
    if (capitalizedToppings.length === 0) return "";
    if (capitalizedToppings.length === 1) return capitalizedToppings[0];
    if (capitalizedToppings.length === 2)
      return capitalizedToppings.join(" y ");
    return (
      capitalizedToppings.slice(0, -1).join(", ") +
      " y " +
      capitalizedToppings.slice(-1)
    );
  };

  const handleEditTotal = () => {
    setIsEditingTotal(true);
  };

  const handleSaveTotal = () => {
    setIsEditingTotal(false);
    onTotalChange(editableTotal);
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTotal(Number(e.target.value));
  };

  return (
    <div className="flex flex-col w-full font-coolvetica justify-center bg-gray-200 shadow-lg rounded-lg">
      <div className="flex flex-row px-4 pb-2 pt-1 w-full gap-6 items-center">
        <h5 className="text-6xl font-bold">
          Carrito:{" "}
          {isEditingTotal ? (
            <input
              type="number"
              value={editableTotal}
              onChange={handleTotalChange}
              className="text-4xl w-40 bg-white text-black px-2 rounded"
            />
          ) : (
            currencyFormat(editableTotal)
          )}
        </h5>

        {isEditingTotal ? (
          <button
            onClick={handleSaveTotal}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
        ) : (
          editableTotal > 0 && (
            <div className="flex flex-row gap-2">
              <img
                src={editIcon}
                className="h-4 cursor-pointer"
                onClick={handleEditTotal}
              />

              <svg
                onClick={limpiarDetallePedido}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 cursor-pointer"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )
        )}
      </div>
      {detallePedido.length > 0 ? (
        <div className="flex flex-col">
          {detallePedido.map((p, index) => (
            <div
              key={index}
              className="flex items-center border-t border-t-1 border-black border-opacity-20"
            >
              <div className="flex-grow font-medium  flex flex-row  justify-between">
                <p className="pl-4 py-2">
                  {p.quantity}x {capitalizeBurgerName(p.burger ?? "")}
                  {p.toppings &&
                    p.toppings.length > 0 &&
                    ` con ${formatToppings(p.toppings)}`}
                  : {currencyFormat(p.subTotal)}
                </p>
                <button
                  onClick={() => onRemoveItem(index)}
                  className=" font-medium mt-3 mr-3  rounded-full bg-black text-gray-100 text-xs h-4 w-4 flex items-center text-cemter justify-center"
                >
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h2 className="px-4 py-2 text-left border-t border-1 border-black border-opacity-20 text-gray-400 font-light w-full">
          El carrito está vacío
        </h2>
      )}
    </div>
  );
};
