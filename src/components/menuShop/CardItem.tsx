import { useState } from "react";
import currencyFormat from "../../helpers/currencyFormat";
import { ModalItem } from "./ModalItem";
import { DetallePedidoProps } from "../../pages/DynamicForm";

interface Props {
  img: string;
  name: string;
  price: number;
  category?: string;
  type: string;
  description?: string;
  handleFormBurger: (value: DetallePedidoProps) => void;
}

export const CardItem = ({
  img,
  name,
  price,
  type,
  handleFormBurger,
}: Props) => {
  const [showModal, setShowModal] = useState(false);

  const closeModal: () => void = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className="h-full font-coolvetica font-black bg-gray-200 shadow-lg p-2 rounded-lg flex flex-col justify-between">
        <div className="pt-4 relative">
          {/* Gradient background container */}
          <div className="absolute inset-0 bg-gradient-to-tr h-24 from-red-600 to-black rounded-lg " />

          {/* Image container */}
          <div className="relative">
            <img
              className="mx-auto my-auto h-16 relative z-10"
              src={`/menu/${img}`}
              alt="product image"
            />
          </div>
        </div>

        <div className="pb-2 ">
          <div className="">
            <h5 className=" pt-6 flex  items-center font-medium text-left  text-black">
              {name
                .split(" ")
                .map((word) =>
                  word.toLowerCase() === "2x1"
                    ? word
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ")}
            </h5>
            <span className="font-black text-xl text-left text-black ">
              {currencyFormat(price)}
            </span>
          </div>
        </div>
        <div
          onClick={() => setShowModal(true)}
          className="bg-black cursor-pointer   rounded-lg text-gray-100 text-center font-bold py-2"
        >
          Agregar
        </div>
      </div>
      {showModal && (
        <ModalItem
          closeModal={closeModal}
          name={name}
          price={price}
          type={type}
          handleFormBurger={handleFormBurger}
        />
      )}
    </>
  );
};
