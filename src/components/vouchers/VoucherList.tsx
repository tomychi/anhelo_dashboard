import React, { useState, useEffect } from "react";
import { obtenerTodosLosVouchers, Voucher } from "../../firebase/voucher";

export const VoucherList: React.FC = () => {
	const [vouchers, setVouchers] = useState<Voucher[]>([]);
	const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		const fetchVouchers = async () => {
			setLoading(true);
			try {
				const allVouchers = await obtenerTodosLosVouchers();
				setVouchers(allVouchers);
			} catch (error) {
				console.error("Error al obtener todos los vouchers:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchVouchers();
	}, []);

	useEffect(() => {
		setFilteredVouchers(vouchers.filter((v) => v.estado === "disponible"));
	}, [vouchers]);

	const handleCopyVoucher = (codigo: string) => {
		navigator.clipboard.writeText(codigo);
		alert(`Código ${codigo} copiado al portapapeles`);
	};

	return (
		<div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
			<table className=" w-full text-xs text-left text-black">
				<thead className=" text-black border  ">
					<tr>
						<th scope="col" className="pl-4 w-2/5 py-3">
							Campaña
						</th>

						<th scope="col" className="pl-4 w-1/6 py-3">
							Fecha
						</th>
						<th scope="col" className="pl-4 w-1/6 py-3">
							Canjeados
						</th>
						<th scope="col" className="pl-4 w-1/6 py-3 "></th>
					</tr>
				</thead>
				<tbody>
					{loading ? (
						<tr>
							<td colSpan={4} className="text-center py-4">
								Cargando vouchers...
							</td>
						</tr>
					) : filteredVouchers.length > 0 ? (
						filteredVouchers.map((voucher, index) => (
							<tr
								key={index}
								className="text-black border font-light border-black border-opacity-20"
							>
								<th scope="row" className="pl-4 w-1/5 font-light py-3">
									{voucher.codigo}
								</th>
								<td className="pl-4 w-1/7 font-light py-3">{voucher.titulo}</td>
								<td className="pl-4 w-1/7 font-light">
									<p className="bg-yellow-500 p-1 rounded-md text-center">
										{voucher.estado}
									</p>
								</td>
								<td className="pl-4 w-1/7 font-light py-3">
									<button
										onClick={() => handleCopyVoucher(voucher.codigo)}
										className="bg-green-500 text-white py-1 px-2 rounded-lg hover:bg-green-600"
									>
										Copiar
									</button>
								</td>
							</tr>
						))
					) : (
						<tr>
							<td colSpan={4} className="text-center py-4">
								No hay vouchers disponibles.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};
