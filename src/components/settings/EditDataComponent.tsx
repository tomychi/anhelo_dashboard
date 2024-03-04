import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { EditModal } from "./EditModal";
import { InfoDataProps, InfoItemProps } from "../../types/types";

export const EditDataComponent = () => {
	const [data, setData] = useState<InfoDataProps[]>([]);
	const [loading, setLoading] = useState(false);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<InfoItemProps>({
		description: "",
		img: "",
		name: "",
		price: 0,
		type: "",
	}); // Para mantener los detalles del elemento seleccionado
	const [id, setId] = useState<string>(""); // Para mantener los detalles del elemento seleccionado
	const [collectionName, setCollectionName] = useState<string>(""); // Para mantener los detalles del elemento seleccionado
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);

	useEffect(() => {
		const fetchDataFromFirestore = async () => {
			setLoading(true);
			const firestore = getFirestore();
			const collections = ["burgers", "drinks", "fries", "toppings"];

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
					description: item.data.description || "",
					img: item.data.img || "",
					name: item.data.name || "",
					price: item.data.price || 0,
					type: item.data.type || "",
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
		<div className="p-4">
			<table className=" h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
				<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
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
							className="bg-black text-custom-red uppercase font-black border border-red-main"
						>
							<th
								scope="row"
								className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
							>
								{data.name}
							</th>
							<td className="px-6 py-4">{data.type}</td>
							<td className="px-6 py-4">${data.price}</td>
							<td className="px-6 py-4">{data.img}</td>
							<td className="px-6 py-4 ">{data.description}</td>
							<td className="px-6 py-4 text-center hidden md:table-cell">
								<div
									onClick={() => {
										if (data && id && collectionName) {
											handleEditClick(data, id, collectionName);
										}
									}}
									className="font-black border border-red-main text-custom-red hover:underline"
								>
									EDITAR
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
