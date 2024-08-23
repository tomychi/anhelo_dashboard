import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Swal from "sweetalert2";
import { useState } from "react";
import { updateMaterialStockManual } from "../firebase/Materiales";

export const Stock = () => {
	const { materiales } = useSelector((state: RootState) => state.materials);

	const [editingId, setEditingId] = useState<null | string>(null);
	const [newValue, setNewValue] = useState("");

	const handleCellClick = (id: string) => {
		setEditingId(id);
		setNewValue("");
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setNewValue(event.target.value);
	};
	const handleInputBlur = async (id: string) => {
		setEditingId(null);
		if (newValue.trim() === "") return; // Evitar actualizaciones con valor vacío
		try {
			await updateMaterialStockManual(id, parseInt(newValue, 10));
			Swal.fire({
				title: "¡Éxito!",
				text: "¡El stock del material ha sido actualizado correctamente!",
				icon: "success",
				confirmButtonText: "OK",
			});
		} catch (error) {
			console.error("Error updating material stock:", error);
			// Manejar el error según tus necesidades
		}
	};

	const handleKeyPress = async (
		event: React.KeyboardEvent<HTMLInputElement>,
		id: string
	) => {
		if (event.key === "Enter") {
			event.preventDefault();
			await handleInputBlur(id);
		}
	};

	return (
		<div className="p-4 flex flex-col gap-4">
			<div className="">
				<div className=" font-coolvetica">
					<table className=" w-full text-sm text-left rtl:text-right text-black">
						<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
							{/* Encabezados de la tabla */}
							{/* Encabezados de la tabla */}
							<tr>
								<th scope="col" className="px-6 py-3">
									Estado
								</th>
								<th scope="col" className="px-6 py-3  lg:table-cell">
									Producto
								</th>
								<th scope="col" className="px-6 py-3  lg:table-cell">
									Cantidad
								</th>

								<th scope="col" className="px-6 py-3  lg:table-cell">
									Unidad
								</th>

								<th scope="col" className="px-6 py-3  lg:table-cell">
									Proveedores
								</th>
							</tr>
						</thead>
						<tbody>
							{/* Mapeo de datos de burgers */}
							{materiales.map(({ id, nombre, stock, unit }) => (
								<tr
									key={id}
									className="bg-black text-custom-red uppercase font-black border border-red-main"
								>
									<th
										scope="row"
										className="px-6 py-4 font-black text-green-600 whitespace-nowrap "
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="w-5 h-5"
										>
											<path
												fillRule="evenodd"
												d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
												clipRule="evenodd"
											/>
										</svg>
									</th>
									<td className="px-6 py-4  lg:table-cell">{nombre}</td>
									<td
										className={`px-6 py-4  lg:table-cell ${
											editingId === id ? "bg-white" : ""
										}`}
										onClick={() => handleCellClick(id)}
									>
										{editingId === id ? (
											<input
												type="number"
												className="w-full border-none"
												value={newValue}
												onChange={handleInputChange}
												onBlur={() => handleInputBlur(id)}
												onKeyPress={(event) => handleKeyPress(event, id)}
												autoFocus
											/>
										) : (
											stock
										)}
									</td>
									<td className="px-6 py-4  lg:table-cell">{unit}</td>

									<td className="px-6 py-4 text-center  md:table-cell">
										<div
											className="font-black border border-red-main text-custom-red hover:underline px-1"
											onClick={() =>
												Swal.fire({
													title: "¿Estás seguro?",
													text: "¡No podrás revertir esto!",
													icon: "warning",
													showCancelButton: true,
													confirmButtonColor: "#3085d6",
													cancelButtonColor: "#d33",
													confirmButtonText: "Sí, eliminarlo",
													cancelButtonText: "Cancelar",
												}).then((result) => {
													console.log(result);
												})
											}
										>
											Comprar a Makro
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
