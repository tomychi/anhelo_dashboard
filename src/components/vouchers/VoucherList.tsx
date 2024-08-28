import React, { useState, useEffect } from "react";
import { obtenerTodosLosVouchers, Voucher } from "../../firebase/voucher";

interface GroupedVoucher {
	titulo: string;
	fecha: string;
	usados: number;
	total: number;
	codigos: string[];
}

export const VoucherList: React.FC = () => {
	const [groupedVouchers, setGroupedVouchers] = useState<GroupedVoucher[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		const fetchVouchers = async () => {
			setLoading(true);
			try {
				const allVouchers = await obtenerTodosLosVouchers();
				const grouped = groupVouchersByTitle(allVouchers);
				setGroupedVouchers(grouped);
			} catch (error) {
				console.error("Error al obtener todos los vouchers:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchVouchers();
	}, []);

	const groupVouchersByTitle = (vouchers: Voucher[]): GroupedVoucher[] => {
		const groupedObj: { [key: string]: GroupedVoucher } = {};

		vouchers.forEach((voucher) => {
			if (!groupedObj[voucher.titulo]) {
				groupedObj[voucher.titulo] = {
					titulo: voucher.titulo,
					fecha: voucher.fecha,
					usados: 0,
					total: 0,
					codigos: [],
				};
			}

			groupedObj[voucher.titulo].total++;
			groupedObj[voucher.titulo].codigos.push(voucher.codigo);
			if (voucher.estado === "usado") {
				groupedObj[voucher.titulo].usados++;
			}

			if (
				new Date(voucher.fecha) > new Date(groupedObj[voucher.titulo].fecha)
			) {
				groupedObj[voucher.titulo].fecha = voucher.fecha;
			}
		});

		return Object.values(groupedObj);
	};

	const getUsageColor = (usados: number, total: number): string => {
		const ratio = usados / total;
		if (ratio < 0.25) return "bg-red-main";
		if (ratio < 0.5) return "bg-yellow-500";
		return "text-green-500";
	};

	const copyCodigosToClipboard = (codigos: string[]) => {
		const codigosText = codigos.join("\n");
		navigator.clipboard.writeText(codigosText).then(
			() => {
				alert("Códigos copiados al portapapeles");
			},
			(err) => {
				console.error("Error al copiar códigos: ", err);
				alert("Error al copiar códigos");
			}
		);
	};

	return (
		<table className="w-full text-xs text-left font-coolvetica text-black">
			<thead className="text-black">
				<tr>
					<th scope="col" className="pl-4 w-3/12 py-3">
						Campaña
					</th>
					<th scope="col" className="pl-4 w-1/12 py-3">
						Fecha
					</th>
					<th scope="col" className="pl-4 w-1/12 py-3">
						Canjeados
					</th>
					<th scope="col" className="pl-4 w-1/12 py-3">
						Coste por resultado
					</th>
					<th scope="col" className="w-3/12 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{loading ? (
					<tr>
						<td colSpan={5} className="text-center py-4">
							Cargando vouchers...
						</td>
					</tr>
				) : groupedVouchers.length > 0 ? (
					groupedVouchers.map((group, index) => (
						<tr
							key={index}
							className="text-black border font-light border-black border-opacity-20"
						>
							<td className="w-3/12 font-light py-3 pl-4">{group.titulo}</td>
							<td className="w-1/12 pl-4 font-light py-3">{group.fecha}</td>
							<td className="w-1/12 pl-4 font-light">
								<p
									className={`p-1 rounded-md text-center ${getUsageColor(
										group.usados,
										group.total
									)}`}
								>
									{`${group.usados}/${group.total}`}
								</p>
							</td>
							<td className="w-1/12 pl-4 font-light py-3">$350</td>
							<td className="w-3/12 font-medium pr-4">
								<button
									onClick={() => copyCodigosToClipboard(group.codigos)}
									className="p-1 rounded-md text-center text-gray-100 bg-black w-full"
								>
									Códigos
								</button>
							</td>
						</tr>
					))
				) : (
					<tr>
						<td colSpan={5} className="text-center py-4">
							No hay campañas disponibles.
						</td>
					</tr>
				)}
			</tbody>
		</table>
	);
};
