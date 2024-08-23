import { useState } from "react";
import { EditModal } from "./EditModal";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { DocumentData } from "firebase/firestore";

export const EditDataComponent = () => {
	const { burgers, drinks, toppings, fries } = useSelector(
		(state: RootState) => state.product
	);

	const data = [...burgers, ...drinks, ...toppings, ...fries];

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<DocumentData>({
		description: "",
		img: "",
		name: "",
		price: 0,
		type: "",
	}); // Para mantener los detalles del elemento seleccionado
	const [id, setId] = useState<string>(""); // Para mantener los detalles del elemento seleccionado
	const [collectionName, setCollectionName] = useState<string>(""); // Para mantener los detalles del elemento seleccionado

	const handleEditClick = (
		item: DocumentData,
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
		<div className="p-4">
			<table className=" h-min w-full font-coolvetica text-sm text-left rtl:text-right text-black">
				<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
					{/* Encabezados de la tabla */}
					<tr>
						<th scope="col" className="px-6 py-3">
							Product name
						</th>
						<th scope="col" className="px-6 py-3 hidden lg:table-cell">
							Type
						</th>
						<th scope="col" className="px-6 py-3  lg:table-cell">
							Price
						</th>
						<th scope="col" className="px-6 py-3 hidden lg:table-cell">
							Image
						</th>
						<th scope="col" className="px-6 py-3 hidden lg:table-cell">
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
							className="bg-black text-custom-red uppercase font-black border border-red-main"
						>
							<th
								scope="row"
								className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
							>
								{data.name}
							</th>
							<td className="px-6 py-4 hidden lg:table-cell">{data.type}</td>
							<td className="px-6 py-4  lg:table-cell">${data.price}</td>
							<td className="px-6 py-4 hidden lg:table-cell">{data.img}</td>
							<td className="px-6 py-4 hidden lg:table-cell">
								{data.description}
							</td>
							<td className="px-6 py-4 text-center">
								<div
									onClick={() => {
										if (data && id && collectionName) {
											handleEditClick(data, id, collectionName);
										}
									}}
									className="font-black border border-red-main text-custom-red hover:underline px-1"
								>
									EDITAR
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{isModalOpen && (
				<EditModal
					closeModal={closeModal}
					item={selectedItem}
					id={id}
					collectionName={collectionName}
				/>
			)}
		</div>
	);
};
