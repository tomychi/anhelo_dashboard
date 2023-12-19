export const Card = ({ comanda }: any) => {
	const { numeroPedido, pedido, direccion, aclaraciones, hora, total } =
		comanda;

	// Dividir el cuerpo del pedido en líneas
	const lineasCuerpoPedido = pedido.split("\n");

	const imprimirTicket = async (nuevoPedido: any) => {
		try {
			const response = await fetch("http://localhost:3000/imprimir", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ nuevoPedido }),
			});

			if (response.ok) {
				nuevoPedido.elaborado = true;
				console.log("Impresión exitosa");
			} else {
				console.error("Error al imprimir");
			}
		} catch (error) {
			console.error("Error en la solicitud:", error);
		}
	};
	return (
		<div
			className={`flex flex-col justify-between max-w-sm  overflow-hidden shadow-lg ${
				comanda.elaborado
					? "bg-green-500 hover:bg-green-600"
					: "bg-red-400 hover:bg-red-600"
			}`}
		>
			<div className="px-6 py-4">
				<p
					className={`text-lg ${
						comanda.elaborado ? "text-green-900" : "text-gray-900"
					} font-bold float-right`}
				>
					{numeroPedido}
				</p>
				<p
					className={`text-2xl ${
						comanda.elaborado ? "text-green-500" : "text-black"
					} font-bold`}
				>
					{hora}
				</p>
				{lineasCuerpoPedido.map((linea: any, index) => (
					<p
						key={index}
						className={`text-${
							comanda.elaborado ? "green" : "black"
						} text-base font-semibold`}
					>
						{linea}
						{linea.startsWith("toppings") ? <br /> : null}
					</p>
				))}
				<p className="text-purple-800">{aclaraciones}</p>
			</div>
			<div className="px-6 py-4">
				<p
					className={`text-base ${
						comanda.elaborado ? "text-green-700" : "text-gray-700"
					}`}
				>
					{direccion}
				</p>
				<p
					className={`text-lg ${
						comanda.elaborado ? "text-green-500" : "text-black"
					} font-bold float-right`}
				>
					{total}
				</p>
				<button
					onClick={() => imprimirTicket(comanda)}
					className={`mt-8 ${
						comanda.elaborado
							? "bg-gray-300 hover:bg-gray-400"
							: "bg-gray-300 hover:bg-gray-400"
					} text-${
						comanda.elaborado ? "green-800" : "gray-800"
					} font-bold py-2 px-4  inline-flex items-center`}
				>
					<svg
						className={`fill-current w-4 h-4 mr-2 ${
							comanda.elaborado ? "text-green-800" : "text-gray-800"
						}`}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
					>
						<path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
					</svg>
					<span>Imprimir ticket</span>
				</button>
			</div>
		</div>
	);
};
