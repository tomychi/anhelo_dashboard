import React from "react";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	modoAgrupacion: string;
	setModoAgrupacion: (modo: "entrega" | "recorrido") => void;
	tiempoMaximo: number | null;
	setTiempoMaximo: (tiempo: number | null) => void;
	tiempoMaximoRecorrido: number | null;
	setTiempoMaximoRecorrido: (tiempo: number | null) => void;
	velocidadPromedio: number | null;
	handleCadeteVelocidadChange: (
		e: React.ChangeEvent<HTMLSelectElement>
	) => void;
	cadetesDisponibles: any[];
	calcularVelocidadPromedio: (cadete: any) => number;
}

const Sidebar: React.FC<SidebarProps> = ({
	isOpen,
	onClose,
	modoAgrupacion,
	setModoAgrupacion,
	tiempoMaximo,
	setTiempoMaximo,
	tiempoMaximoRecorrido,
	setTiempoMaximoRecorrido,
	velocidadPromedio,
	handleCadeteVelocidadChange,
	cadetesDisponibles,
	calcularVelocidadPromedio,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50">
			<div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg p-4">
				<button onClick={onClose} className="absolute top-2 right-2 text-2xl">
					&times;
				</button>
				<h2 className="text-xl font-bold mb-4">Opciones</h2>

				<div className="mb-4">
					<p className="font-bold mb-2">Modo de Agrupación</p>
					<div className="flex flex-col gap-2">
						<button
							className={`py-2 px-4 rounded-full font-medium ${
								modoAgrupacion === "entrega"
									? "bg-black text-white"
									: "bg-gray-200"
							}`}
							onClick={() => setModoAgrupacion("entrega")}
						>
							Tiempo máximo de entrega
						</button>
						<button
							className={`py-2 px-4 rounded-full font-medium ${
								modoAgrupacion === "recorrido"
									? "bg-black text-white"
									: "bg-gray-200"
							}`}
							onClick={() => setModoAgrupacion("recorrido")}
						>
							Tiempo máximo de recorrido
						</button>
					</div>
				</div>

				<div className="mb-4">
					<p className="font-bold mb-2">Parámetros</p>
					<select
						value={
							modoAgrupacion === "entrega"
								? tiempoMaximo || ""
								: tiempoMaximoRecorrido || ""
						}
						onChange={(e) => {
							const value = e.target.value ? parseInt(e.target.value) : null;
							modoAgrupacion === "entrega"
								? setTiempoMaximo(value)
								: setTiempoMaximoRecorrido(value);
						}}
						className="w-full p-2 rounded border mb-2"
					>
						<option value="">¿Minutos máximos?</option>
						{[30, 40, 50, 60, 70, 80, 90].map((tiempo) => (
							<option key={tiempo} value={tiempo}>
								{tiempo} minutos
							</option>
						))}
					</select>

					<select
						onChange={handleCadeteVelocidadChange}
						className="w-full p-2 rounded border"
					>
						<option value="">¿Velocidad promedio?</option>
						{cadetesDisponibles
							.filter((cadete) => cadete.name !== "NO ASIGNADO")
							.map((cadete) => (
								<option key={cadete.id} value={cadete.name}>
									{cadete.name}: {calcularVelocidadPromedio(cadete)} km/h
								</option>
							))}
					</select>
				</div>
			</div>
		</div>
	);
};

export default Sidebar;
