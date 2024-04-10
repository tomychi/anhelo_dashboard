import { useState } from "react";
import currencyFormat from "../helpers/currencyFormat";

import {
	getFirestore,
	collection,
	addDoc,
	DocumentReference,
	DocumentData,
} from "firebase/firestore";
import { ProductoMaterial } from "../types/types";
import { Ingredients } from "../components/gastos";
import { RootState } from "../redux/configureStore";
import { useSelector } from "react-redux";
export const UploadMateriales = (
	materiales: ProductoMaterial[]
): Promise<DocumentReference[]> => {
	const firestore = getFirestore();
	const materialesCollectionRef = collection(firestore, "materiales");

	// Mapear cada material para subirlo a la base de datos
	const uploadPromises: Promise<DocumentReference>[] = materiales.map(
		async (material) => {
			try {
				// Agregar el material a la colección 'materiales'
				const docRef = await addDoc(materialesCollectionRef, material);
				return docRef;
			} catch (error) {
				console.error("Error al subir el material:", error);
				throw error;
			}
		}
	);

	return Promise.all(uploadPromises);
};

export const Neto = () => {
	const { materiales } = useSelector((state: RootState) => state.materials);
	const { burgers, drinks, toppings, fries } = useSelector(
		(state: RootState) => state.product
	);

	const pburgers = burgers.map((b) => b.data);
	const pdrinks = drinks.map((d) => d.data);
	const ptoppings = toppings.map((t) => t.data);
	const pfries = fries.map((f) => f.data);

	const productos = [...pburgers, ...pdrinks, ...ptoppings, ...pfries];
	const [modalOpen, setModalOpen] = useState<boolean>(false);
	const [selectedProduct, setSelectedProduct] = useState<DocumentData | null>(
		null
	);

	const openModal = (product: DocumentData) => {
		setSelectedProduct(product);
		setModalOpen(true);
	};

	//2,2 + 0,1 para cubrir errores
	const multiplierMasterpiecesOriginals = 2.3;
	//1,5 + 0,1 para cubrir errores
	const multiplierSatisfyers = 1.6;
	const multiplierDrinks = 1.5;
	//1,5 + 0,1 para cubrir errores
	const multiplierPapas = 1.6;
	const ordersLastMonth = 1484;
	const plusAlquiler = Math.ceil(300000 / ordersLastMonth);

	console.log(productos);

	return (
		<div className="flex p-4 gap-4  justify-between flex-row w-full">
			<div className="w-4/5 flex flex-col gap-4">
				<table className=" h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
					<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
						<tr>
							<th scope="col" className="px-6 py-3">
								Productos
							</th>
							<th scope="col" className="px-6 py-3">
								Categoria
							</th>
							<th scope="col" className="px-6 py-3">
								costo
							</th>
							<th scope="col" className="px-6 py-3">
								precio venta
							</th>
							<th scope="col" className="px-6 py-3">
								Ganancia
							</th>
							<th scope="col" className="px-6 py-3">
								precio venta sugerido
							</th>
							<th scope="col" className="px-6 py-3">
								Ganancia obtenida
							</th>
						</tr>
					</thead>
					<tbody>
						{productos.map((p: DocumentData, index: number) => {
							return (
								<tr
									key={index}
									className="bg-black text-custom-red uppercase font-black border border-red-main"
								>
									<th
										scope="row"
										className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
									>
										{p.name}
									</th>
									<td className="px-6 py-4">{p.type}</td>
									<td
										className="px-6 py-4 cursor-pointer hover:bg-custom-red hover:text-black"
										onClick={() => openModal(p)}
									>
										{currencyFormat(p.costo)}
									</td>
									<td className="px-6 py-4">{currencyFormat(p.price)}</td>
									<td className="px-6 py-4">
										{currencyFormat(p.price - p.costo)} - ganancia:
										{Math.ceil(((p.price - p.costo) * 100) / p.price)}%
									</td>
									{/*Precio venta sugerido. el costo por el multiplier mas los 250*/}
									<td className="px-6 py-4 flex flex-row gap-2">
										{currencyFormat(
											p.type === "satisfyer"
												? p.costo * multiplierSatisfyers + plusAlquiler
												: p.type === "masterpieces" || p.type === "originals"
												? p.costo * multiplierMasterpiecesOriginals +
												  plusAlquiler
												: p.type === "drink"
												? p.costo * multiplierDrinks + plusAlquiler
												: p.type === "papas"
												? p.costo * multiplierPapas + plusAlquiler
												: p.price
										)}{" "}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="w-4 h-4"
										>
											<path
												fill-rule="evenodd"
												d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 10.28a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 1 0-1.06 1.06l1.72 1.72H8.25a.75.75 0 0 0 0 1.5h5.69l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3Z"
												clip-rule="evenodd"
											/>
										</svg>
										{(p.type === "satisfyer"
											? p.costo * multiplierSatisfyers + plusAlquiler - p.price
											: p.type === "masterpieces" || p.type === "originals"
											? p.costo * multiplierMasterpiecesOriginals +
											  plusAlquiler -
											  p.price
											: p.type === "drink"
											? p.costo * multiplierDrinks + plusAlquiler - p.price
											: p.type === "papas"
											? p.costo * multiplierPapas + plusAlquiler - p.price
											: p.price) >= 0
											? "+"
											: "-"}
										{currencyFormat(
											Math.abs(
												p.type === "satisfyer"
													? p.costo * multiplierSatisfyers +
															plusAlquiler -
															p.price
													: p.type === "masterpieces" || p.type === "originals"
													? p.costo * multiplierMasterpiecesOriginals +
													  plusAlquiler -
													  p.price
													: p.type === "drink"
													? p.costo * multiplierDrinks + plusAlquiler - p.price
													: p.type === "papas"
													? p.costo * multiplierPapas + plusAlquiler - p.price
													: p.price
											)
										)}
									</td>

									{/* Ganancia obtenida sugerida*/}
									<td className="px-6 py-4">
										{currencyFormat(
											p.type === "satisfyer"
												? p.costo * multiplierSatisfyers +
														plusAlquiler -
														p.costo
												: p.type === "masterpieces" || p.type === "originals"
												? p.costo * multiplierMasterpiecesOriginals +
												  250 -
												  p.costo
												: p.type === "drink"
												? p.costo * multiplierDrinks + plusAlquiler - p.costo
												: p.type === "papas"
												? p.costo * multiplierPapas + plusAlquiler - p.costo
												: null
										)}{" "}
										- ganancia:
										{100 -
											Math.ceil(
												p.type === "satisfyer"
													? // costo por 100 dividido por el precio de venta
													  (p.costo * 100) /
															(p.costo * multiplierSatisfyers + plusAlquiler)
													: p.type === "masterpieces" || p.type === "originals"
													? // costo por 100 dividido por el precio de venta
													  (p.costo * 100) /
													  (p.costo * multiplierMasterpiecesOriginals +
															plusAlquiler)
													: p.type === "drink"
													? // costo por 100 dividido por el precio de venta
													  (p.costo * 100) /
													  (p.costo * multiplierDrinks + plusAlquiler)
													: p.type === "papas"
													? // costo por 100 dividido por el precio de venta
													  (p.costo * 100) /
													  (p.costo * multiplierPapas + plusAlquiler)
													: 0 // valor predeterminado en caso de que ninguna de las condiciones anteriores se cumpla
											)}
										%
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{modalOpen && selectedProduct && (
					<Ingredients
						selectedProduct={selectedProduct}
						setModalOpen={setModalOpen}
						materiales={materiales}
					/>
				)}
				<h1 className="text-custom-red font-antonio text-8xl font-black">
					ENVIOS:
				</h1>
				<h2 className="text-custom-red font-antonio text-2xl font-black">
					JUEVES $20.000 <br />
					VIERNES, SABADO & DOMINGO $30.000
				</h2>
			</div>
			<div className="w-1/5">
				<table className=" h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
					<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
						{/* Encabezados de la tabla */}
						<tr>
							<th scope="col" className="px-6 py-3">
								materiales
							</th>
							<th scope="col" className="px-6 py-3">
								precio
							</th>
						</tr>
					</thead>
					<tbody>
						{materiales.map((m: ProductoMaterial, index: number) => (
							<tr
								key={index}
								// className="bg-black text-custom-red uppercase font-black border border-red-main"
								draggable
								className={
									"bg-black text-custom-red uppercase font-black border border-red-main cursor-pointer"
								}
							>
								<th
									scope="row"
									className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
								>
									{m.nombre}
								</th>
								<td className="px-6 py-4">{currencyFormat(m.costo)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
