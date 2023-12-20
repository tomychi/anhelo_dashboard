import { useEffect, useState } from 'react';
import items from '../../assets/menu.json';
import { CardItem } from './CardItem';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

interface Props {
  handleFormBurger: (value: any) => void;
}

export const MenuGallery = ({ handleFormBurger }: Props) => {
  const [data, setData] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Función para cargar los datos iniciales desde Firestore
    const fetchDataFromFirestore = async () => {
      const firestore = getFirestore();

      const collections = ['burgers', 'drinks', 'fries', 'toppings'];

      const fetchedData = await Promise.all(
        collections.map(async (collectionName) => {
          const collectionRef = collection(firestore, collectionName);
          const snapshot = await getDocs(collectionRef);

          const dataWithIds = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
            collectionName: collectionName,
          }));

          return dataWithIds;
        })
      );

      setData(fetchedData.flat());
      setInitialLoadComplete(true); // Establecer la carga inicial como completa
    };

    // Solo cargamos datos si aún no se ha realizado la carga inicial
    if (!initialLoadComplete) {
      fetchDataFromFirestore();
    }
  }, [initialLoadComplete]);

  return (
    <div className="flex flex-col">
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
