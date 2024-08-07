import React, { useState } from "react";
import mapa from "../assets/mapa.png";
import logo from "../assets/anheloTMblack.png";

// Define el tipo para las propiedades del componente PedidoCard
interface PedidoCardProps {
	direccion: string;
	demora: string;
	monto: string;
	isVisible: boolean;
	index: number;
}

const pedidos: Omit<PedidoCardProps, "isVisible" | "index">[] = [
	{
		direccion: "Marcelo T. De Alvear 546",
		demora: "17 minutos",
		monto: "$17.820",
	},
	{
		direccion: "Av. Siempre Viva 742",
		demora: "25 minutos",
		monto: "PAGADO",
	},
	{
		direccion: "Calle Falsa 123",
		demora: "10 minutos",
		monto: "$8.500",
	},
];

const PedidoCard: React.FC<PedidoCardProps> = ({
	direccion,
	demora,
	monto,
	isVisible,
	index,
}) => (
	<div
		className={`flex flex-row justify-between border border-red-main transition-transform duration-300 ease-in-out ${
			isVisible ? "transform-none" : "transform -translate-y-full"
		}`}
		style={{ transitionDelay: `${index * 100}ms` }}
	>
		<div className="flex flex-col p-4">
			<p className="uppercase mb-2 mt-2 bg-black font-black text-red-main font-antonio">
				{direccion}
			</p>
			<p className="text-red-main text-xs font-black font-antonio">
				Demora: {demora}
			</p>
			<p className="text-red-main text-xs font-black font-antonio">
				{monto === "PAGADO" ? "Cobrar: PAGADO" : `Cobrar: ${monto}`}
			</p>
		</div>
		<div className="flex flex-col justify-between">
			<div className="uppercase p-2 flex flex-row items-center h-1/2 bg-white font-black justify-center text-black font-antonio gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="1.5"
					stroke="currentColor"
					className=" h-4"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0-6 6m3 12c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z"
					/>
				</svg>

				<p>LLAMAR</p>
			</div>
			<div className="uppercase p-2 flex flex-row items-center h-1/2 bg-green-500 font-black justify-center text-black font-antonio gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="1.5"
					stroke="currentColor"
					className=" h-5"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					/>
				</svg>

				<p>ENTREGAR</p>
			</div>
		</div>
	</div>
);

export const AnheloRiders: React.FC = () => {
	const [isListVisible, setIsListVisible] = useState(false);

	const toggleListVisibility = () => {
		setIsListVisible(!isListVisible);
	};

	return (
		<div className="flex flex-col">
			{/* Parte de la ganancia */}
			<div className="bg-red-main flex flex-row justify-between p-4">
				<div>
					<div className="flex flex-row gap-2 items-baseline">
						<p className="text-4xl font-black font-antonio">$7020</p>
						<p className="text-xs font-black font-antonio uppercase">
							ganancia
						</p>
					</div>
					<div className="flex flex-row gap-2 items-baseline">
						<p className="text-4xl font-black font-antonio">$280</p>
						<p className="text-xs font-black font-antonio uppercase">propina</p>
					</div>
				</div>
				<div className="flex flex-col justify-between">
					<div className="flex flex-col items-end">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
							className="w-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							/>
						</svg>
						<p className="text-xs font-black font-antonio uppercase">
							ver detalles
						</p>
					</div>
					<img src={logo} alt="logo" className="h-4" />
				</div>
			</div>
			{/* Parte del mapa */}
			<div>
				<img src={mapa} alt="mapa" />
			</div>
			{/* Parte de los pedidos */}
			<div className="flex flex-col">
				<button
					onClick={toggleListVisibility}
					className="uppercase bg-red-main p-4 font-black font-antonio text-left flex justify-between items-center"
				>
					<span>Pedidos por entregar ({pedidos.length})</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className={`h-6 w-6 transform transition-transform duration-300 ${
							isListVisible ? "rotate-180" : ""
						}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				{/* Contenedor para la lista de pedidos con transición */}
				<div
					className={`transition-all duration-500 ease-in-out overflow-hidden ${
						isListVisible ? "max-h-[1000px]" : "max-h-0"
					}`}
				>
					{pedidos.map((pedido, index) => (
						<PedidoCard
							key={index}
							{...pedido}
							isVisible={isListVisible}
							index={index}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
