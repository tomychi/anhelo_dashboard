import React, { useEffect, useState } from "react";
import arrowIcon from "../../assets/arrowIcon.png";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	modoAgrupacion: string;
	setModoAgrupacion: (modo: "entrega" | "recorrido") => void;
	tiempoMaximo: number | null;
	setTiempoMaximo: (tiempo: number | null) => void;
	tiempoMaximoRecorrido: number | null;
	setTiempoMaximoRecorrido: (tiempo: number | null) => void;
	showComandas: boolean;
	setShowComandas: (show: boolean) => void;
	velocidadPromedio: number | null;
	handleCadeteVelocidadChange: (
		e: React.ChangeEvent<HTMLSelectElement>
	) => void;
	cadetesDisponibles: any[];
	calcularVelocidadPromedio: (cadete: any) => number;
}

const Toggle: React.FC<{ isOn: boolean; onToggle: () => void }> = ({
	isOn,
	onToggle,
}) => (
	<div
		className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${
			isOn ? "bg-black" : "bg-gray-300"
		}`}
		onClick={onToggle}
	>
		<div
			className={`bg-gray-100 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
				isOn ? "translate-x-6" : ""
			}`}
		/>
	</div>
);

const Sidebar: React.FC<SidebarProps> = ({
	isOpen,
	onClose,
	modoAgrupacion,
	setModoAgrupacion,
	tiempoMaximo,
	setTiempoMaximo,
	tiempoMaximoRecorrido,
	setTiempoMaximoRecorrido,
	showComandas,
	setShowComandas,
	velocidadPromedio,
	handleCadeteVelocidadChange,
	cadetesDisponibles,
	calcularVelocidadPromedio,
}) => {
	const [isRendered, setIsRendered] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsRendered(true);
		} else {
			const timer = setTimeout(() => setIsRendered(false), 300);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	if (!isRendered && !isOpen) return null;

	return (
		<div
			className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
				isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
			}`}
			onClick={onClose}
		>
			<div
				className={`fixed right-0 top-0 h-full w-64 bg-white shadow-lg p-4 transition-transform duration-300 ease-in-out transform ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-2xl font-bold mb-4">Configuración</h2>

				<div className="mb-4">
					<p className="font-bold mb-2 text-sm">Modo de Agrupación</p>
					<div className="flex flex-col gap-2">
						<button
							className={`py-2 px-4 rounded-full text-sm font-medium ${
								modoAgrupacion === "entrega"
									? "bg-black text-white"
									: "bg-gray-300"
							}`}
							onClick={() => setModoAgrupacion("entrega")}
						>
							Tiempo máximo de entrega
						</button>
						<button
							className={`py-2 px-4 rounded-full text-sm font-medium ${
								modoAgrupacion === "recorrido"
									? "bg-black text-white"
									: "bg-gray-300"
							}`}
							onClick={() => setModoAgrupacion("recorrido")}
						>
							Tiempo máximo de recorrido
						</button>
					</div>
				</div>

				<div className="mb-4">
					<p className="font-bold mb-2 text-sm">Parámetros</p>
					<div className="relative inline-block mb-2 w-full">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-6 absolute left-3  top-1/2 -translate-y-1/2"
							style={
								modoAgrupacion === "entrega"
									? tiempoMaximo === null
										? {}
										: { filter: "invert(100%)" }
									: tiempoMaximoRecorrido === null
									? {}
									: { filter: "invert(100%)" }
							}
						>
							<path
								fillRule="evenodd"
								d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
								clipRule="evenodd"
							/>
						</svg>
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
							className={`h-10 appearance-none text-sm  pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full w-full ${
								modoAgrupacion === "entrega"
									? tiempoMaximo === null
										? "bg-gray-300 text-black"
										: "bg-black text-gray-100"
									: tiempoMaximoRecorrido === null
									? "bg-gray-300 text-black"
									: "bg-black text-gray-100"
							}`}
							style={{
								WebkitAppearance: "none",
								MozAppearance: "none",
							}}
						>
							<option value="">¿Minutos máximos?</option>
							{[30, 40, 50, 60, 70, 80, 90].map((tiempo) => (
								<option key={tiempo} value={tiempo}>
									{tiempo} minutos
								</option>
							))}
						</select>
						<img
							src={arrowIcon}
							alt="Arrow Icon"
							className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
							style={
								modoAgrupacion === "entrega"
									? tiempoMaximo === null
										? {}
										: { filter: "invert(100%)" }
									: tiempoMaximoRecorrido === null
									? {}
									: { filter: "invert(100%)" }
							}
						/>
					</div>

					<div className="relative inline-block w-full">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-6 absolute left-3 top-1/2 -translate-y-1/2"
							style={
								velocidadPromedio === null ? {} : { filter: "invert(100%)" }
							}
						>
							<path
								fillRule="evenodd"
								d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
								clipRule="evenodd"
							/>
						</svg>
						<select
							onChange={handleCadeteVelocidadChange}
							className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full w-full text-sm ${
								velocidadPromedio === null
									? "bg-gray-300 text-black"
									: "bg-black text-gray-100"
							}`}
							style={{
								WebkitAppearance: "none",
								MozAppearance: "none",
							}}
						>
							<option value="">¿Velocidad promedio?</option>
							{cadetesDisponibles
								.filter((cadete) => cadete.name !== "NO ASIGNADO")
								.map((cadete) => {
									const cadeteNameFormatted =
										cadete.name.charAt(0).toUpperCase() +
										cadete.name.slice(1).toLowerCase();
									return (
										<option
											key={`${cadete.name}-${cadete.id}-filter`}
											value={cadete.name}
										>
											{cadeteNameFormatted}: {calcularVelocidadPromedio(cadete)}{" "}
											km/h
										</option>
									);
								})}
						</select>
						<img
							src={arrowIcon}
							alt="Arrow Icon"
							className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
							style={
								velocidadPromedio === null ? {} : { filter: "invert(100%)" }
							}
						/>
					</div>
				</div>

				<div className="mb-4">
					<p className="font-bold mb-2 text-sm">Mostrar Comandas</p>
					<div className="flex items-center justify-between">
						<Toggle
							isOn={showComandas}
							onToggle={() => setShowComandas(!showComandas)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Sidebar;
