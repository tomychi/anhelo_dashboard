import { ChangeEvent, useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
// Importa tu lógica para actualizar datos en Firebase Firestore
import Swal from 'sweetalert2';
import { updateDataInFirestore } from './Update';
import { DocumentData } from 'firebase/firestore';

interface EditModalProps {
  closeModal: () => void;
  item: DocumentData;
  id: string;
  collectionName: string;
}

export const EditModal = ({
  closeModal,
  item,
  id,
  collectionName,
}: EditModalProps) => {
  // Establece el estado para los valores del formulario
  const [formData, setFormData] = useState({
    name: item.name,
    img: item.img,
    price: item.price, // Convertir a número usando parseFloat
    type: item.type,
    description: item.description,
  });

  // Maneja los cambios en el formulario
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' ? parseInt(value) : value, // Convertir a número solo si el campo es 'price'
    });
  };

  // Maneja la confirmación para actualizar los datos
  const handleConfirmation = () => {
    // Llama a la función para actualizar los datos en Firebase Firestore con formData
    updateDataInFirestore(id, collectionName, formData);

    // Cierra el modal o muestra un mensaje de éxito, etc.
    Swal.fire('¡Datos actualizados!', '', 'success');
    closeModal();
  };

  return (
    <div
      id="crud-modal"
      className=" fixed inset-0  bg-black  overflow-y-auto overflow-x-hidden  flex items-center justify-center z-50 w-full  p-4"
    >
      <div className=" p-4 my-auto mx-auto bg-custom-red w-full">
        <div className="  flex flex-col font-antonio ">
          <div className=" flex flex-row pb-4 gap-4 justify-between">
            <h3 className="text-4xl flex justify-center uppercase font-black">
              Edit Product
            </h3>

            <button className="" onClick={closeModal}>
              <span className=" flex justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="border-2 border-black w-9 h-9"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
        <div className="uppercase font-antonio font-black">
          <div className="flex flex-col gap-4 ">
            <div className="relative z-0 mt-3">
              <label className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="block py-2.5 texk-black w-full  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer "
                placeholder="Type product name"
              />
            </div>
            <div className="relative z-0 mt-4  ">
              <label className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Image
              </label>
              <input
                type="text"
                name="img"
                id="img"
                value={formData.img}
                onChange={handleInputChange}
                className="block py-2.5 texk-black w-full  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                placeholder="Image"
              />
            </div>
            <div className="relative z-0 mt-4  ">
              <label className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Price
              </label>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleInputChange}
                className="block py-2.5 texk-black w-full  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                placeholder="$2999"
              />
            </div>

            <div className="relative z-0 mt-4  ">
              <label className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Type
              </label>
              <input
                type="text"
                name="type"
                id="type"
                value={formData.type}
                onChange={handleInputChange}
                className="block py-2.5 texk-black w-full  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                placeholder="originals"
              />
            </div>
            <div className="relative z-0 mt-4  ">
              <label className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Product Description
              </label>
              <input
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                className="block py-2.5 texk-black w-full  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
              ></input>
            </div>
          </div>
          <ConfirmationModal handleConfirmation={handleConfirmation} />
        </div>
      </div>
    </div>
  );
};
