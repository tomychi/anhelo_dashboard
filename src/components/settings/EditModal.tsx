import { ChangeEvent, useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
// Importa tu lógica para actualizar datos en Firebase Firestore
import Swal from "sweetalert2";
import { updateDataInFirestore } from "./Update";
import { InfoItemProps } from "../../types/types";

interface EditModalProps {
	closeModal: () => void;
	item: InfoItemProps;
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
		price: item.price,
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
			[name]: value,
		});
	};

	// Maneja la confirmación para actualizar los datos
	const handleConfirmation = () => {
		// Llama a la función para actualizar los datos en Firebase Firestore con formData
		updateDataInFirestore(id, collectionName, formData);

		// Cierra el modal o muestra un mensaje de éxito, etc.
		Swal.fire("¡Datos actualizados!", "", "success");
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
					<div className="grid gap-4 mb-4 grid-cols-2">
						<div className="col-span-2">
							<label className="block mb-2 text-sm text-black">Name</label>
							<input
								type="text"
								name="name"
								id="name"
								value={formData.name}
								onChange={handleInputChange}
								className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
								placeholder="Type product name"
							/>
						</div>
						<div className="col-span-2">
							<label className="block mb-2 text-sm text-black">Image</label>
							<input
								type="text"
								name="name"
								id="name"
								value={formData.img}
								onChange={handleInputChange}
								className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
								placeholder="Image"
							/>
						</div>
						<div className="col-span-2 sm:col-span-1">
							<label className="block mb-2 text-sm text-black">Price</label>
							<input
								type="number"
								name="price"
								id="price"
								value={formData.price}
								onChange={handleInputChange}
								className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
								placeholder="$2999"
							/>
						</div>

						<div className="col-span-2 sm:col-span-1">
							<label className="block mb-2 text-sm text-black">Type</label>
							<input
								type="text"
								name="type"
								id="type"
								value={formData.type}
								onChange={handleInputChange}
								className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
								placeholder="$2999"
							/>
						</div>
						<div className="col-span-2">
							<label className="block mb-2 text-sm text-black">
								Product Description
							</label>
							<textarea
								id="description"
								rows={4}
								value={formData.description}
								onChange={handleInputChange}
								className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								placeholder="Write product description here"
							></textarea>
						</div>
					</div>
					<ConfirmationModal handleConfirmation={handleConfirmation} />
				</div>
			</div>
		</div>
	);
};
