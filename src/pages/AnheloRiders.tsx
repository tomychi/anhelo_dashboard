import React, { useState, useEffect } from "react";
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

const pedidosPorEntregar: Omit<PedidoCardProps, "isVisible" | "index">[] = [
	{
		direccion: "Marcelo T. De Alvear 546",
		demora: "17 minutos",
		monto: "$17.820",
	},
	{
		direccion: "Av. Siempre Viva 742",
		demora: "25 minutos",
		monto: "$15.500",
	},
];

const pedidosEntregados: Omit<PedidoCardProps, "isVisible" | "index">[] = [
	{
		direccion: "Calle Falsa 123",
		demora: "10 minutos",
		monto: "PAGADO",
	},
];

const pedidosCancelados: Omit<PedidoCardProps, "isVisible" | "index">[] = [
	{
		direccion: "Av. Rivadavia 1234",
		demora: "30 minutos",
		monto: "CANCELADO",
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
		className={`flex flex-row justify-between border-b border-b-red-main transition-transform duration-300 ease-in-out ${
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
				{monto === "PAGADO" || monto === "CANCELADO"
					? `Cobrar: ${monto}`
					: `Cobrar: ${monto}`}
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
	const [isPorEntregarVisible, setIsPorEntregarVisible] = useState(false);
	const [isEntregadosVisible, setIsEntregadosVisible] = useState(false);
	const [isCanceladosVisible, setIsCanceladosVisible] = useState(false);

	const togglePorEntregar = () =>
		setIsPorEntregarVisible(!isPorEntregarVisible);
	const toggleEntregados = () => setIsEntregadosVisible(!isEntregadosVisible);
	const toggleCancelados = () => setIsCanceladosVisible(!isCanceladosVisible);

	useEffect(() => {
		const setVh = () => {
			let vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};

		setVh();

		window.addEventListener("resize", setVh);
		return () => window.removeEventListener("resize", setVh);
	}, []);

	return (
		<div className="flex flex-col h-screen h-[calc(var(--vh,1vh)*100)]">
			{/* Parte de la ganancia */}
			<div className="bg-red-main flex flex-row justify-between p-4 shadow-xl">
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
			<div className="flex-grow relative">
				<img
					src={mapa}
					alt="mapa"
					className="absolute inset-0 w-full h-full object-cover"
				/>
			</div>
			{/* Parte de pedidos */}
			<div className="overflow-y-auto max-h-[40vh] pb-safe">
				{/* Pedidos por entregar */}
				<div className="flex flex-col">
					<button
						onClick={togglePorEntregar}
						className="uppercase bg-yellow-400 p-4 font-black font-antonio text-left flex justify-between items-center"
					>
						<span>Pedidos por entregar ({pedidosPorEntregar.length})</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={`h-6 w-6 transform transition-transform duration-300 ${
								isPorEntregarVisible ? "rotate-180" : ""
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
					<div
						className={`transition-all duration-500 ease-in-out overflow-hidden ${
							isPorEntregarVisible ? "max-h-[1000px]" : "max-h-0"
						}`}
					>
						{pedidosPorEntregar.map((pedido, index) => (
							<PedidoCard
								key={index}
								{...pedido}
								isVisible={isPorEntregarVisible}
								index={index}
							/>
						))}
					</div>
				</div>
				{/* Pedidos entregados */}
				<div className="flex flex-col">
					<button
						onClick={toggleEntregados}
						className="uppercase bg-green-500 p-4 font-black font-antonio text-left flex justify-between items-center"
					>
						<span>Pedidos entregados ({pedidosEntregados.length})</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={`h-6 w-6 transform transition-transform duration-300 ${
								isEntregadosVisible ? "rotate-180" : ""
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
					<div
						className={`transition-all duration-500 ease-in-out overflow-hidden ${
							isEntregadosVisible ? "max-h-[1000px]" : "max-h-0"
						}`}
					>
						{pedidosEntregados.map((pedido, index) => (
							<PedidoCard
								key={index}
								{...pedido}
								isVisible={isEntregadosVisible}
								index={index}
							/>
						))}
					</div>
				</div>
				{/* Pedidos cancelados */}
				<div className="flex flex-col">
					<button
						onClick={toggleCancelados}
						className="uppercase bg-red-main p-4 font-black font-antonio text-left flex justify-between items-center"
					>
						<span>Pedidos cancelados ({pedidosCancelados.length})</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={`h-6 w-6 transform transition-transform duration-300 ${
								isCanceladosVisible ? "rotate-180" : ""
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
					<div
						className={`transition-all duration-500 ease-in-out overflow-hidden ${
							isCanceladosVisible ? "max-h-[1000px]" : "max-h-0"
						}`}
					>
						{pedidosCancelados.map((pedido, index) => (
							<PedidoCard
								key={index}
								{...pedido}
								isVisible={isCanceladosVisible}
								index={index}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
