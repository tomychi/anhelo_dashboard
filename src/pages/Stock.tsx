import { eliminarDocumento } from "../firebase/ReadData";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Swal from "sweetalert2";

export const Stock = () => {
	const { expenseData } = useSelector((state: RootState) => state.data);

	return (
		<div className="p-4 flex flex-col gap-4">
			<div className="">
				<div className=" font-antonio">
					<table className=" w-full text-sm text-left rtl:text-right text-black">
						<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
							{/* Encabezados de la tabla */}
							<tr>
								<th scope="col" className="px-6 py-3">
									Estado
								</th>
								<th scope="col" className="px-6 py-3 hidden lg:table-cell">
									Producto
								</th>
								<th scope="col" className="px-6 py-3 hidden lg:table-cell">
									Cantidad
								</th>

								<th scope="col" className="px-6 py-3 hidden lg:table-cell">
									Proveedores
								</th>
							</tr>
						</thead>
						<tbody>
							{/* Mapeo de datos de burgers */}
							{expenseData.map(({ fecha, category, name, id }) => (
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
												fill-rule="evenodd"
												d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
												clip-rule="evenodd"
											/>
										</svg>
									</th>
									<td className="px-6 py-4 hidden lg:table-cell">{category}</td>
									<td className="px-6 py-4 hidden lg:table-cell">{fecha}</td>

									<td className="px-6 py-4 text-center hidden md:table-cell">
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
													if (result.isConfirmed) {
														eliminarDocumento("gastos", id, fecha)
															.then(() => {
																Swal.fire({
																	icon: "success",
																	title: "¡Eliminado!",
																	text: `El gasto con ID ${id} ha sido eliminado.`,
																});
															})
															.catch(() => {
																Swal.fire({
																	icon: "error",
																	title: "Error",
																	text: "No se pudo eliminar el gasto.",
																});
															});
													}
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
