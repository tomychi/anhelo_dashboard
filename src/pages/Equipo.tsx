import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { projectAuth } from "../firebase/config";
import { ExpenseProps, UpdateExpenseStatus } from "../firebase/UploadGasto";

export const Equipo = () => {
	const { expenseData } = useSelector((state: RootState) => state.data);
	const currentUserEmail = projectAuth.currentUser?.email;
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

	const filteredExpenseData = isMarketingUser
		? expenseData.filter((expense) => expense.category === "marketing")
		: expenseData;
	const [expenses, setExpenses] = useState<ExpenseProps[]>(filteredExpenseData);

	const [showModal, setShowModal] = useState(false);

	const toggleModal = () => {
		setShowModal(!showModal);
	};

	const handleStatusChange = async (
		id: string,
		newStatus: "pendiente" | "pagado"
	) => {
		try {
			// Actualiza el estado en la base de datos
			await UpdateExpenseStatus(
				id,
				newStatus,
				expenses.find((exp) => exp.id === id)?.fecha || ""
			);

			// Actualiza el estado local
			setExpenses(
				expenses.map((exp) =>
					exp.id === id ? { ...exp, estado: newStatus } : exp
				)
			);
		} catch (error) {
			console.error("Error actualizando el estado:", error);
		}
	};

	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between items-center mt-8 mx-4">
				<p className="text-black font-bold text-4xl ">Equipo</p>
				<NavLink
					className="bg-black h-10 gap-2 text-gray-100 mt-2 rounded-full flex items-center pt-3 pb-4 pl-4 pr-4 "
					onClick={toggleModal} // Llama a toggleModal al hacer clic
					to={"/nuevaCompra"}
				>
					<p className="font-medium">Nuevo miembro </p>
					<p className="text-lg mb-[2px] font-black">+ </p>
				</NavLink>
			</div>
			<div className="w-1/3 bg-black h-[0.5px] mt-4"></div>
			<div className="p-4">
				<div className="flex flex-row gap-2 mt-2">
					<div className=" flex items-center w-1/3 h-10 rounded-lg border border-black focus:ring-0 font-coolvetica text-black px-4 pr-8 text-xs font-light">
						Todos
					</div>
					<div className=" flex items-center w-2/3 h-10 rounded-lg border border-black focus:ring-0 font-coolvetica text-black px-4 pr-8 text-xs font-light">
						Buscar
					</div>
				</div>
			</div>

			<div className=" font-coolvetica">
				<table className=" w-full text-xs text-left text-black">
					<thead className=" text-black border  ">
						<tr>
							<th scope="col" className="pl-4 w-2/5 py-3">
								Nombre
							</th>

							<th scope="col" className="pl-4 w-1/6 py-3">
								Puesto
							</th>
							<th scope="col" className="pl-4 w-1/6 py-3">
								Correo
							</th>
							<th scope="col" className="pl-4 w-1/6 py-3 "></th>
						</tr>
					</thead>
					<tbody>
						{filteredExpenseData.map(
							({
								quantity,
								fecha,
								category,
								name,
								total,
								unit,
								description,
								estado,
								id,
							}) => (
								<tr
									key={id}
									className=" text-black border font-light border-black border-opacity-20"
								>
									<th scope="row" className="pl-4 w-1/5 font-light py-3">
										{name} ({quantity} u.)
									</th>

									<td className="pl-4 w-1/7 font-light py-3">
										{currencyFormat(total)}
									</td>
									<td className="pl-4 w-1/7 font-light">
										<select
											className="bg-gray-300 p-1 rounded-lg"
											value={estado}
											onChange={(e) =>
												handleStatusChange(
													id,
													e.target.value as "pendiente" | "pagado"
												)
											}
										>
											<option value="pendiente">Pendiente</option>
											<option value="pagado">Pagado</option>
										</select>
									</td>
									<td className="pl-4 w-1/7 font-black text-2xl relative bottom-2 ">
										. . .
									</td>
									{/* <td className="px-6 py-4 text-center hidden md:table-cell">
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
											Borrar
										</div>
									</td> */}
								</tr>
							)
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
