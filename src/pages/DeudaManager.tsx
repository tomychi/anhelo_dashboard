import React, { useState, useEffect } from "react";
import { getInversiones, type Inversion } from "../firebase/Inversion";

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
		<div className="p-4">
			<h2 className="text-2xl font-bold mb-4">Inversiones</h2>
			<div className="space-y-4">
				{inversiones.map((inversion) => (
					<div key={inversion.id} className="border rounded-lg p-4 shadow-sm">
						<p className="font-semibold">
							Monto: ${inversion.Monto.toLocaleString("es-AR")}
						</p>
						<p>Deadline: {inversion.Deadline.toLocaleDateString("es-AR")}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default DeudaManager;
