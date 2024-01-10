import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { EditModal } from './EditModal';
import { InfoDataProps, InfoItemProps } from '../../types/types';

export const EditDataComponent = () => {
  const [data, setData] = useState<InfoDataProps[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InfoItemProps>({
    description: '',
    img: '',
    name: '',
    price: 0,
    type: '',
  }); // Para mantener los detalles del elemento seleccionado
  const [id, setId] = useState<string>(''); // Para mantener los detalles del elemento seleccionado
  const [collectionName, setCollectionName] = useState<string>(''); // Para mantener los detalles del elemento seleccionado
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const fetchDataFromFirestore = async () => {
      setLoading(true);
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

      const transformedData = fetchedData.flat().map((item) => ({
        id: item.id,
        data: {
          description: item.data.description || '',
          img: item.data.img || '',
          name: item.data.name || '',
          price: item.data.price || 0,
          type: item.data.type || '',
        },
        collectionName: item.collectionName,
      }));

      setData(transformedData);
      setLoading(false);
      setInitialLoadComplete(true);
    };

    // Solo cargamos datos si aún no se ha realizado la carga inicial
    if (!initialLoadComplete) {
      fetchDataFromFirestore();
    }
  }, [initialLoadComplete]);

  // const handleUpdateData = () => {
  //   fetchDataFromFirestore();
  // };

  const handleEditClick = (
    item: InfoItemProps,
    id: string,
    collectionName: string
  ) => {
    console.log(item);
    setIsModalOpen(true);
    setId(id);
    setCollectionName(collectionName);
    setSelectedItem(item);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Renderizar los datos obtenidos
  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      {loading ? (
        <div
          role="status "
          className="fixed overflow-y-auto overflow-x-hidden inset-0 flex items-center justify-center z-50 w-full"
        >
          <svg
            className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-red-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            {/* Encabezados de la tabla */}
            <tr>
              <th scope="col" className="px-6 py-3">
                Product name
              </th>
              <th scope="col" className="px-6 py-3">
                Type
              </th>
              <th scope="col" className="px-6 py-3">
                Price
              </th>
              <th scope="col" className="px-6 py-3">
                Image
              </th>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Mapeo de datos de burgers */}
            {data.map(({ data, id, collectionName }) => (
              <tr
                key={id}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {data.name}
                </th>
                <td className="px-6 py-4">{data.type}</td>
                <td className="px-6 py-4">${data.price}</td>
                <td className="px-6 py-4">{data.img}</td>
                <td className="px-6 py-4 ">{data.description}</td>
                <td className="px-6 py-4 text-right">
                  <div
                    onClick={() => {
                      if (data && id && collectionName) {
                        handleEditClick(data, id, collectionName);
                      }
                    }}
                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                  >
                    Edit
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <EditModal
            closeModal={closeModal}
            item={selectedItem}
            id={id}
            collectionName={collectionName}
          />
        </div>
      )}
    </div>
  );
};
