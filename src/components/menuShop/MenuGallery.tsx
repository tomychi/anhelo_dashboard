import { useEffect, useState } from 'react';
import { CardItem } from './CardItem';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { ReadData } from '../../firebase/ReadData';

interface Props {
  handleFormBurger: (value: any) => void;
}

export const MenuGallery = ({ handleFormBurger }: Props) => {
  const [data, setData] = useState([]);

  const getData = async () => {
    if (data.length === 0) {
      const info = await ReadData();
      setData(info);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={getData}
        className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red bg-red-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          data-slot="icon"
        >
          <path
            fillRule="evenodd"
            d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
            className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red bg-red-800"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {['originals', 'masterpieces', 'papas', 'drink'].map((sectionName) => (
        <div key={sectionName}>
          <h1 className="text-custom-red font-antonio text-2xl font-black mb-4 ">
            {sectionName.toUpperCase()}
          </h1>
          <div className="grid grid-cols-6 md:grid-cols-6 gap-4 mb-4">
            {/* Renderizar items de la sección correspondiente */}
            {data
              .filter((item) => item.data.type === sectionName)
              .map(({ id, data }) => (
                <CardItem
                  key={id}
                  img={data.img}
                  name={data.name}
                  price={data.price}
                  type={data.type}
                  handleFormBurger={handleFormBurger}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
