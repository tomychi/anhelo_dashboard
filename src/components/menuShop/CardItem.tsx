import { useState } from 'react';
import currencyFormat from '../../helpers/currencyFormat';
import { ModalItem } from './ModalItem';

interface Props {
  img: string;
  name: string;
  price: number;
  category?: string;
  type: string;
  description?: string;
  handleFormBurger: (value: any) => void;
}

export const CardItem = ({
  img,
  name,
  price,
  type,
  handleFormBurger,
}: Props) => {
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className=" h-full font-antonio font-black bg-custom-red flex flex-col justify-between"
      >
        <div className="pt-4">
          <img
            className="mx-auto h-16"
            src={`/menu/${img}`}
            alt="product image"
          />
        </div>

        <div className="p-4 cursor-pointer">
          <div className="text-center">
            <h5 className="text-sm font-black text-black uppercase">{name}</h5>
            <hr className="my-2 border-t-2 w-full border-black" />
            <div className="flex items-center justify-center">
              <span className="text-sm font-black text-black">
                {currencyFormat(price)}
              </span>
            </div>
          </div>
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
