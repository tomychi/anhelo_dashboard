import Swal from "sweetalert2";
import currencyFormat from "../../helpers/currencyFormat";
import { ComandaRareProps, PedidoProps } from "../../types/types";
import {
	eliminarDocumento,
	marcarPedidoComoElaborado,
} from "../../firebase/ReadData";

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
	} = comanda;
	console.log(comanda);
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
				await marcarPedidoComoElaborado(id); // Llamamos a la función para marcar el pedido como elaborado
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
	return (
		<div
			className={`flex  justify-center font-antonio uppercase flex-col  max-w-sm  overflow-hidden ${
				elaborado ? "bg-green-500 hover:bg-green-600" : "bg-custom-red"
			}`}
		>
			<div className="relative p-4">
				<div className="absolute top-2 right-2 p-2">
					<svg
						onClick={() => eliminarDocumento("pedidos", id)}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="w-6 h-6 cursor-pointer"
					>
						<path
							fillRule="evenodd"
							d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
				<div className="mb-4 flex justify-center">
					<p className={`text-2xl text-white font-bold`}>{hora}</p>
					<p className="bg-black  text-2xl text-center text-green-500">
						{aclaraciones}
					</p>
				</div>
				{detallePedido.map(
					(
						{
							burger,
							toppings,
							quantity,
						}: { burger: string; toppings: string[]; quantity: number },
						i: number
					) => (
						<div key={i} className="flex items-center flex-col">
							<p className="text-black text-base  font-bold">
								{quantity}X {burger}
							</p>
							<p>
								{toppings.map((topping: string, toppingIndex: number) => (
									<span key={toppingIndex} className="text-sm block">
										- {topping}
									</span>
								))}
							</p>
						</div>
					)
				)}
			</div>
			<div className="px-6 py-4 text-center">
				<p
					className={`text-base ${
						elaborado ? "text-green-700" : "texk-black 700"
					}`}
				>
					Direccion: {direccion}
				</p>
				<p
					className={`text-base ${
						elaborado ? "text-green-700" : "texk-black 700"
					}`}
				>
					Referencias: {referencias}
				</p>
				<p
					className={`text-base ${
						elaborado ? "text-green-700" : "texk-black 700"
					}`}
				>
					TELEFONO: {telefono}
				</p>
				<p
					className={`text-base ${
						elaborado ? "text-green-700" : "texk-black 700"
					}`}
				>
					Metodo de pago:{metodoPago}
				</p>
				<p
					className={`text-lg ${
						elaborado ? "text-green-500" : "text-black"
					} font-bold`}
				>
					{currencyFormat(total)}
				</p>
				<button
					onClick={() => imprimirTicket(comanda)}
					className={`mt-8 bg-black ${
						elaborado ? "text-green-500" : "text-custom-red"
					} font-bold py-2 px-4  inline-flex items-center`}
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
			</div>
		</div>
	);
};
