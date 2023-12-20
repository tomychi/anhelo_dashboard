import { useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { EditModal } from './EditModal';

export const EditDataComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Para mantener los detalles del elemento seleccionado
  const [id, setId] = useState(null); // Para mantener los detalles del elemento seleccionado
  const [collectionName, setCollectionName] = useState(null); // Para mantener los detalles del elemento seleccionado

  const fetchDataFromFirestore = async () => {
    setLoading(true);

    const firestore = getFirestore();

    const collections = ['burgers', 'drinks', 'fries', 'toppings'];

    const fetchedData = await Promise.all(
      collections.map(async (collectionName) => {
        const collectionRef = collection(firestore, collectionName);
        const snapshot = await getDocs(collectionRef);

        // Mapear los datos y los IDs
        const dataWithIds = snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
          collectionName: collectionName, // Para mantener el nombre de la colección
        }));

        return dataWithIds;
      })
    );

    // Almacenar los datos y los IDs en el estado
    setData(fetchedData.flat());
    setLoading(false);
  };

  const handleUpdateData = () => {
    fetchDataFromFirestore();
  };

  const handleEditClick = (item, id, collectionName) => {
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
      <button
        className="bg-red-800"
        onClick={handleUpdateData}
        disabled={loading}
      >
        {loading ? (
          'Loading...'
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            data-slot="icon"
            className="w-5 h-5 text-red transition duration-75 text-red group-hover:text-red group-hover:text-custom-red"
          >
            <path
              fillRule="evenodd"
              data="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
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
                  onClick={() => handleEditClick(data, id, collectionName)}
                  className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                >
                  Edit
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
