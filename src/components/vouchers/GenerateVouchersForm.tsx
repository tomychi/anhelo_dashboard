import { useState } from "react";
import { generarVouchers } from "../../firebase/voucher";
import { VoucherList } from "./VoucherList";

export const GenerateVouchersForm = () => {
	const [cantidad, setCantidad] = useState<number>(0);
	const [titulo, setTitulo] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const handleGenerateVouchers = async () => {
		setLoading(true);
		try {
			await generarVouchers(cantidad, titulo);
			alert("Vouchers generados y almacenados correctamente");
		} catch (error) {
			console.error("Error al generar y almacenar vouchers:", error);
			alert("Error al generar vouchers");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col ">
			<div className="mt-11">
				<div className="w-1/5 bg-black h-[0.5px] "></div>
				<p className="text-black font-medium text-2xl px-4  mt-2">
					Generar vouchers 2x1
				</p>
			</div>
			<div className="p-4 flex flex-col gap-4">
				<input
					type="text"
					value={titulo}
					placeholder="Título"
					onChange={(e) => setTitulo(e.target.value)}
					className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
				/>

				<input
					type="number"
					placeholder="Cantidad"
					value={cantidad || ""}
					onChange={(e) => {
						const value = e.target.value;
						setCantidad(value === "" ? 0 : parseInt(value, 10));
					}}
					className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
				/>
				<div className="flex justify-between items-center">
					<button
						onClick={handleGenerateVouchers}
						disabled={loading}
						className="text-gray-100 w-full h-10 px-4  bg-black font-bold rounded-md outline-none"
					>
						{loading ? "Generando..." : "Generar Vouchers"}
					</button>
				</div>
				<VoucherList />
			</div>
		</div>
	);
};
