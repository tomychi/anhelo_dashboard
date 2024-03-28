import Swal from "sweetalert2";
import currencyFormat from "../../helpers/currencyFormat";
import { ComandaRareProps, PedidoProps } from "../../types/types";
import {
	eliminarDocumento,
	marcarPedidoComoElaborado,
	marcarPedidoComoEntregado,
} from "../../firebase/ReadData";
import { ChangeEvent, useEffect, useState } from "react";
import {
	updateCadeteForOrder,
	updateTiempoElaboradoForOrder,
	updateTiempoEntregaForOrder,
} from "../../firebase/UploadOrder";
import { addCadete, readCadetes } from "../../firebase/Cadetes";
import {
	obtenerDiferenciaHoraria,
	obtenerHoraActual,
} from "../../helpers/dateToday";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { Descuento } from "./Descuento";
import { useLocation } from "react-router-dom";
import { TiempoEditable } from "./TiempoEditable";

const copyToClipboard = (textToCopy: string) => {
	navigator.clipboard
		.writeText(textToCopy)
		.then(() => {
			Swal.fire({
				icon: "success",
				title: "Copiado",
				text: "Texto copiado al portapapeles",
			});
		})
		.catch((error) => {
			console.error("Error copying to clipboard:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Hubo un error al copiar al portapapeles",
			});
		});
};

export const Card = ({ comanda }: ComandaRareProps) => {
	const {
		aclaraciones,
		direccion,
		hora,
		metodoPago,
		total,
		telefono,
		detallePedido,
		elaborado,
		referencias,
		id,
		piso,
		fecha,
		cadete,
		tiempoElaborado,
		tiempoEntregado,
		entregado,
	} = comanda;
	const [selectedCadete, setSelectedCadete] = useState(cadete);
	const [mostrarInfoCompleta, setMostrarInfoCompleta] = useState(false);
	const [mostrarExtras, setMostrarExtras] = useState(false);
	const [nuevoCadete, setNuevoCadete] = useState("");
	const [cadetes, setCadetes] = useState<string[]>([]);
	const user = useSelector((state: RootState) => state.auth.user);
	const location = useLocation();
	const isVentasPage = location.pathname.includes("ventas");

	useEffect(() => {
		const getCadetes = async () => {
			const cade = await readCadetes();
			setCadetes(cade);
		};
		getCadetes();
	}, []);

	const handleNuevoCadeteChange = (event: ChangeEvent<HTMLInputElement>) => {
		setNuevoCadete(event.target.value);
	};

	const agregarNuevoCadete = () => {
		// Aquí puedes agregar la lógica para crear un nuevo cadete con el valor de nuevoCadete
		addCadete(nuevoCadete)
			.then(() => {
				Swal.fire({
					icon: "success",
					title: "CADETE AGREGADO",
					text: `SE AGREGO: ${nuevoCadete} `,
				});
				setCadetes((prev) => [...prev, nuevoCadete]);
			})
			.catch(() => {
				console.error("Error al crear el cadete:");
			});
		setNuevoCadete("");
	};

	// Manejar el cambio en el select
	const handleCadeteChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const nuevoCadete = event.target.value;

		if (nuevoCadete === "default") {
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Elegi un cadete",
			});
			setSelectedCadete("default");

			return;
		}

		if (nuevoCadete === "nuevo") {
			// El usuario eligió agregar un nuevo cadete, restablecer el estado para el nuevo cadete
			setSelectedCadete("nuevo");
			return;
		}
		setSelectedCadete(nuevoCadete);

		// Aquí debes obtener la fecha del pedido y el ID del pedido según tu implementación

		// Luego llama a la función para actualizar el cadete en la base de datos
		updateCadeteForOrder(fecha, id, nuevoCadete)
			.then(() => {
				Swal.fire({
					icon: "success",
					title: "CADETE ASIGNADO",
					text: `El viaje lo lleva: ${nuevoCadete} `,
				});
				// TRAER PEDIDOS ACTUALIZADOS
			})
			.catch(() => {
				console.error("Error al actualizar el cadete del pedido:");
			});
	};
	const imprimirTicket = async (nuevoPedido: PedidoProps) => {
		try {
			const response = await fetch("http://localhost:3000/imprimir", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ nuevoPedido }),
			});

			if (response.ok) {
				const tiempo = obtenerDiferenciaHoraria(hora);
				await marcarPedidoComoElaborado(id, tiempo);
			} else {
				console.error("Error al imprimir");
				Swal.fire({
					icon: "error",
					title: "Error",
					text: "Hubo un error al imprimir el ticket",
				});
			}
		} catch (error) {
			console.error("Error en la solicitud:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Hubo un error en la solicitud",
			});
		}
	};

	const handleCopyIconClick = (textToCopy: string) => {
		copyToClipboard(textToCopy);
		Swal.fire({
			icon: "success",
			title: "Copiado",
			text: "Texto copiado al portapapeles",
		});
	};

	return (
		<div
			className={`flex justify-center font-antonio uppercase flex-col  max-w-sm  overflow-hidden h-min p-4 ${
				elaborado ? "bg-green-500 hover:bg-custom-red" : "bg-custom-red"
			}`}
		>
			<div className="flex flex-col items-center gap-1 justify-center">
				<div className="flex flex-row  mt-6 mb-7">
					<p className={`text-4xl text-black font-black pr-1 pl-1  `}>{hora}</p>
					{user.email === "cadetes@anhelo.com" ? null : (
						<svg
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
										eliminarDocumento("pedidos", id, fecha)
											.then(() => {
												Swal.fire({
													icon: "success",
													title: "¡Eliminado!",
													text: `El pedido con ID ${id} ha sido eliminado.`,
												});
											})
											.catch(() => {
												Swal.fire({
													icon: "error",
													title: "Error",
													text: "No se pudo eliminar el pedido.",
												});
											});
									}
								})
							}
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="p-3 h-12 cursor-pointer  text-black"
						>
							<path
								fillRule="evenodd"
								d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
								clipRule="evenodd"
							/>
						</svg>
					)}
				</div>
				<div className="text-center flex flex-col w-full">
					<div className="flex flex-row w-full ">
						{/* Mostrar dirección por defecto */}
						<p
							className={`uppercase border-4 font-black ${
								mostrarInfoCompleta ? "w-full" : "w-2/3"
							} text-white border-white pl-1 pr-1`}
						>
							Dirección: {direccion}
						</p>

						{!mostrarInfoCompleta && (
							<button
								className="uppercase border-4 font-black w-1/3 text-white border-white pl-1 pr-1"
								onClick={() => setMostrarInfoCompleta(true)}
							>
								Ver más info
							</button>
						)}
					</div>

					{/* Mostrar el resto de la información solo si se hace clic en 'Ver más info' */}
					{mostrarInfoCompleta && (
						<div className="mt-4 mb-4 font-black text-white">
							<p className="text-base">Piso: {piso}</p>
							<p className="text-base">Referencias: {referencias}</p>
							<p className="text-base">
								TELEFONO:{" "}
								<a
									href={`tel:${telefono}`}
									className="text-blue-600 hover:underline"
								>
									{telefono}
								</a>
							</p>
							<p className="text-base">Método de pago: {metodoPago}</p>
							<p className="text-lg font-black">
								MONTO: {currencyFormat(total)}
							</p>
						</div>
					)}
				</div>

				<div className="mt-4 w-full uppercase font-black gap-2 flex flex-row justify-center">
					<label htmlFor="cadete" className="text-white">
						Cadete:
					</label>
					<select
						id="cadete"
						name="cadete"
						value={selectedCadete}
						onChange={handleCadeteChange}
						className={` bg-white  w-full uppercase rounded-none flex flex-row gap-4 ${
							elaborado ? "text-green-500" : "text-custom-red"
						} font-black  `}
					>
						<option value={cadete} defaultValue={cadete}>
							{cadete}
						</option>
						{cadetes.map((c, i) => {
							if (c === cadete) return null;
							return (
								<option value={c} key={i}>
									{c}
								</option>
							);
						})}
						{/* <option value="nuevo">Agregar nuevo cadete</option> */}
					</select>
					{/* Agregar campo para ingresar el nombre del nuevo cadete */}
					{selectedCadete === "nuevo" && (
						<div>
							<input
								type="text"
								value={nuevoCadete}
								onChange={handleNuevoCadeteChange}
							/>
							<button onClick={agregarNuevoCadete}>Agregar</button>
						</div>
					)}
				</div>
				<div className="mt-4 w-full">
					{tiempoElaborado ? (
						<p className="w-full">
							<TiempoEditable
								title="Elaborado en"
								tiempoInicial={tiempoElaborado}
								pedidoId={id}
								fecha={fecha}
								updateTiempoForOrder={updateTiempoElaboradoForOrder}
							/>
						</p>
					) : null}
					{entregado && (
						<p className="w-full">
							<TiempoEditable
								title="Entregado a las"
								tiempoInicial={tiempoEntregado}
								pedidoId={id}
								fecha={fecha}
								updateTiempoForOrder={updateTiempoEntregaForOrder}
							/>
						</p>
					)}
				</div>
			</div>

			<div className=" mt-8">
				{aclaraciones && (
					<p className="w-full mt-8 bg-black  pr-1 pl-1 pb-1 text-4xl text-center text-green-500 font-black">
						{aclaraciones}
					</p>
				)}
				{detallePedido.map(
					(
						{
							burger,
							toppings,
							quantity,
						}: { burger: string; toppings: string[]; quantity: number },
						i: number
					) => (
						<div key={i} className="flex mt-4 items-center flex-col">
							<p className="text-black text-4xl font-black border-4 w-full text-center border-black pr-1 pl-1 pb-1">
								{quantity}X {burger}
							</p>
							<p>
								<div className="flex flex-col items-center ">
									{toppings.map((topping: string, toppingIndex: number) => (
										<span
											key={toppingIndex}
											className={`text-2xl flex  text-black font-black ${
												topping.toLowerCase() === "huevo" ||
												topping.toLowerCase() === "carne"
													? "bg-black mt-4  text-2xl text-center text-green-500"
													: ""
											}`}
										>
											{topping}
										</span>
									))}
								</div>
							</p>
						</div>
					)
				)}
			</div>

			<div>
				{user.email === "cadetes@anhelo.com" ? (
					elaborado && (
						<div>
							{tiempoEntregado === undefined ? (
								<button
									onClick={() => {
										const hor = obtenerHoraActual();
										marcarPedidoComoEntregado(id, hor)
											.then(() => {
												Swal.fire({
													icon: "success",
													title: "ENTREGADOOOOOOOOOOOOOOOO",
													text: `El pedido con ID ${id} ha sido entregado.`,
												});
											})
											.catch(() => {
												Swal.fire({
													icon: "error",
													title: "Error",
													text: "No se pudo entrerga el pedido.",
												});
											});
									}}
									className={`bg-black w-full flex justify-center mt-4 ${
										elaborado ? "text-green-500" : "text-custom-red"
									} font-black p-4  inline-flex items-center`}
								>
									<svg
										className={`fill-current w-4 h-4 mr-2 ${
											elaborado ? "text-green-500" : "text-custom-red"
										}`}
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
									>
										<path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
									</svg>
									<span>ENTREGADO</span>
								</button>
							) : null}
						</div>
					)
				) : (
					<div>
						<button
							onClick={() => imprimirTicket(comanda)}
							className={` bg-black w-full flex justify-center mt-14 ${
								elaborado ? "text-green-500" : "text-custom-red"
							} font-black p-4  inline-flex items-center`}
						>
							<svg
								className={`fill-current w-4 h-4 mr-2 ${
									elaborado ? "text-green-500" : "text-custom-red"
								}`}
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
							>
								<path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
							</svg>
							<span>IMPRIMIR TICKET</span>
						</button>
						<div>
							{isVentasPage ? (
								<div>
									{/* Botón para mostrar o ocultar la sección de EXTRAS */}
									<button
										className=" font-black text-white w-full cursor-pointer mt-4 border-4 border-white"
										onClick={() => setMostrarExtras(!mostrarExtras)}
									>
										{mostrarExtras ? "OCULTAR EXTRAS" : "ACCIONES EXTRAS"}
									</button>

									{/* Renderizar la sección de EXTRAS si mostrarExtras es true */}
									{mostrarExtras && (
										<p className="mt-4">
											<Descuento fechaPedido={fecha} pedidoId={id} />
										</p>
									)}
								</div>
							) : (
								<p>:</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
