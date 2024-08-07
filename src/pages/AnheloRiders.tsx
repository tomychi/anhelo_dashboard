import React from "react";
import mapa from "../assets/mapa.png";

export const AnheloRiders = () => {
	return (
		<div className="flex flex-col">
			{/* Aca la parte de la plata */}
			<div className="bg-red-main flex flex-row  justify-between p-4">
				<div className="">
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
				<div className="flex flex-col items-end ">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						className="w-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
					<p className="text-xs font-black font-antonio uppercase">
						ver detalles
					</p>
				</div>
			</div>
			{/* Aca la parte del mapa */}
			<div>
				<img src={mapa} alt="mapa" />
			</div>
			{/* Aca la parte de los pedidos */}
			<div className=" flex flex-col">
				<p className="uppercase bg-red-main p-4 font-black font-antonio">
					Pedidos por entregar (2)
				</p>
				{/* Card donde mapeamos los pedidos */}
				<div className="flex flex-row justify-between border border-red-main">
					<p className="uppercase p-4 bg-black font-black text-red-main font-antonio">
						1. Marcelo T 546
					</p>
					<p className="uppercase p-4 bg-green-500 font-black text-black font-antonio">
						ENTREGAR
					</p>
				</div>
				<div className="flex flex-row justify-between border border-red-main">
					<p className="uppercase p-4 bg-black font-black text-red-main font-antonio">
						1. Marcelo T 546
					</p>
					<p className="uppercase p-4 bg-green-500 font-black text-black font-antonio">
						ENTREGAR
					</p>
				</div>
				<div className="flex flex-row justify-between border border-red-main">
					<p className="uppercase p-4 bg-black font-black text-red-main font-antonio">
						1. Marcelo T 546
					</p>
					<p className="uppercase p-4 bg-green-500 font-black text-black font-antonio">
						ENTREGAR
					</p>
				</div>
			</div>
		</div>
	);
};
