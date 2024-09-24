import { FormGasto } from "../components/gastos";
import { eliminarDocumento } from "../firebase/ReadData";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Swal from "sweetalert2";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { projectAuth } from "../firebase/config";
import { ExpenseProps, UpdateExpenseStatus } from "../firebase/UploadGasto";

export const Gastos = () => {
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
			<div className="flex flex-row justify-between items-center  mt-7 mx-4 mb-4">
				<p className="text-black font-bold text-4xl mt-1 ">Gastos</p>
				<NavLink
					className="bg-gray-300 gap-2 text-black  rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
					onClick={toggleModal} // Llama a toggleModal al hacer clic
					to={"/nuevaCompra"}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 mt-1"
					>
						<path d="M12.378 1.602a.75.75 0 0 0-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03ZM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 0 0 .372-.648V7.93ZM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 0 0 .372.648l8.628 5.033Z" />
					</svg>
					<p className=" font-bold ">Nueva compra </p>
				</NavLink>
			</div>
			<div className="p-4 ">
				<Calendar />
				<div className="flex flex-row gap-2 mt-2">
					<div className=" flex items-center w-1/3 h-10 rounded-md border-4 border-black focus:ring-0 font-coolvetica text-black px-4 pr-8 text-xs font-light">
						Todos
					</div>
					<div className=" flex items-center w-2/3 h-10 rounded-md border-4 border-black focus:ring-0 font-coolvetica text-black px-4 pr-8 text-xs font-light">
						Buscar
					</div>
				</div>
			</div>

			<div className=" font-coolvetica">
				<table className=" w-full text-xs text-left text-black">
					<thead className=" text-black border-b  ">
						<tr>
							<th scope="col" className="pl-4 w-2/5 py-3">
								Descripcion
							</th>

							<th scope="col" className="pl-4 w-1/6 py-3">
								Total
							</th>
							<th scope="col" className="pl-4 w-1/6 py-3">
								Estado
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
											className="bg-gray-300 p-1 rounded-full"
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
