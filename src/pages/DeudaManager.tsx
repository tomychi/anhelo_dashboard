import React, { useState, useEffect } from "react";
import { getInversiones, type Inversion } from "../firebase/Inversion";
import currencyFormat from "../helpers/currencyFormat";

export const DeudaManager: React.FC = () => {
	const [inversiones, setInversiones] = useState<Inversion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchInversiones = async () => {
			try {
				const inversionesData = await getInversiones();
				setInversiones(inversionesData);
				setLoading(false);
			} catch (err) {
				console.error("Error al obtener las inversiones:", err);
				setError("Error al cargar los datos");
				setLoading(false);
			}
		};

		fetchInversiones();
	}, []);

	if (loading) {
		return <div className="p-4">Cargando inversiones...</div>;
	}

	if (error) {
		return <div className="p-4 text-red-500">{error}</div>;
	}

	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
				<p className="text-black font-bold text-4xl mt-1">Inversiones</p>
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b h-10">
						<tr>
							<th scope="col" className="pl-4 w-2/5">
								Inversor
							</th>
							<th scope="col" className="pl-4 w-1/4">
								Monto
							</th>
							<th scope="col" className="pl-4 w-1/4">
								Deadline
							</th>
							<th scope="col" className="pl-4 w-1/6"></th>
						</tr>
					</thead>
					<tbody>
						{inversiones.map((inversion) => (
							<tr
								key={inversion.id}
								className="text-black border font-light h-10 border-black border-opacity-20"
							>
								<th scope="row" className="pl-4 w-2/5 font-light">
									{inversion.id}
								</th>
								<td className="pl-4 w-1/4 font-light">
									{currencyFormat(inversion.Monto)}
								</td>
								<td className="pl-4 w-1/4 font-light">
									{inversion.Deadline.toLocaleDateString("es-AR")}
								</td>
								<td className="pl-4 pr-4 w-1/6 font-black text-2xl flex items-center justify-end h-full relative">
									<p className="absolute text-2xl top-[-4px] cursor-pointer">
										...
									</p>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default DeudaManager;
