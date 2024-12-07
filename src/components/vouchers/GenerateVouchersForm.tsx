import { useState } from "react";
import { crearVoucher } from "../../firebase/voucher";
import { VoucherList } from "./VoucherList";

export const GenerateVouchersForm = () => {
	const [showForm, setShowForm] = useState(false);
	const [cantidad, setCantidad] = useState(0);
	const [loading, setLoading] = useState(false);

	const [titulo, setTitulo] = useState("");
	const [fecha, setFecha] = useState("");

	const handleCreateVoucher = async () => {
		setLoading(true);
		try {
			await crearVoucher(titulo, fecha, cantidad);
			alert("Voucher creado exitosamente");
			setTitulo("");
			setFecha("");
		} catch (error) {
			alert("Error al crear el voucher");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col">
			<div
				className={`flex ${
					showForm ? "flex-col gap-2" : "flex-row"
				} justify-between font-coolvetica items-center mt-8 mx-4 pb-8`}
			>
				<p className="text-black font-bold text-4xl mt-1">Vouchers</p>
				{!showForm ? (
					<button
						onClick={() => setShowForm(true)}
						className="bg-gray-300 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-6 "
						>
							<path
								fill-rule="evenodd"
								d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
								clip-rule="evenodd"
							/>
						</svg>
						Nueva campaña
					</button>
				) : (
					<></>
				)}

				{showForm ? (
					<div className="mt-4 flex-col space-y-2 w-full">
						<input
							type="text"
							placeholder="Título del voucher"
							value={titulo}
							onChange={(e) => setTitulo(e.target.value)}
							className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
						/>
						<input
							type="date"
							placeholder="Fecha del voucher"
							value={fecha}
							onChange={(e) => setFecha(e.target.value)}
							className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
						/>

						<input
							type="number"
							placeholder="Cantidad de códigos a generar"
							value={cantidad || ""}
							onChange={(e) => {
								const value = e.target.value;
								setCantidad(value === "" ? 0 : parseInt(value, 10));
							}}
							className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
						/>

						<div className="flex justify-between w-full items-center ">
							<button
								onClick={handleCreateVoucher}
								disabled={loading}
								className="text-gray-100 w-full text-3xl h-20 px-4 bg-black font-bold rounded-lg outline-none"
							>
								{loading ? "Creando..." : "Crear"}
							</button>
						</div>
					</div>
				) : (
					<></>
				)}
			</div>

			<VoucherList />
		</div>
	);
};
