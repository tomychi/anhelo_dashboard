import React from "react";
import { NavLink } from "react-router-dom";

export const AnheloRidersStats = () => {
	return (
		<div className="bg-red-main min-h-screen text-black font-antonio">
			<div className="container mx-auto p-4">
				<NavLink
					to="/anheloriders"
					className="flex items-center mb-6 text-black"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="1.5"
						stroke="currentColor"
						className="w-6 h-6 transform rotate-180 mr-2"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
					<span className="text-sm font-black uppercase">Volver</span>
				</NavLink>

				<h1 className="text-6xl font-black mb-4 text-center">NIVEL 2</h1>

				<div className="bg-white text-black p-6  shadow-lg mb-6">
					<h2 className="text-2xl font-bold mb-4">Estadísticas Principales</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<p className="text-sm uppercase">Velocidad promedio</p>
							<p className="text-xl font-bold">40 km/hr</p>
						</div>
						<div>
							<p className="text-sm uppercase">Horas conectado promedio</p>
							<p className="text-xl font-bold">3:32 hs</p>
						</div>
						<div>
							<p className="text-sm uppercase">Paga promedio por hora</p>
							<p className="text-xl font-bold">$8000</p>
						</div>
					</div>
				</div>

				<div className="bg-white text-black p-6  shadow-lg mb-6">
					<h2 className="text-2xl font-bold mb-4">Resumen de Actividad</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p className="text-sm uppercase">Km recorridos</p>
							<p className="text-xl font-bold">42 kms = $8000</p>
						</div>
						<div>
							<p className="text-sm uppercase">Puntos de entrega</p>
							<p className="text-xl font-bold">21 = $21.000</p>
						</div>
					</div>
				</div>

				<div className="bg-white text-black p-6  shadow-lg">
					<h2 className="text-2xl font-bold mb-4">Desglose de Paga</h2>
					{[1, 2, 3, 4, 5].map((pedido) => (
						<div key={pedido} className="mb-4 last:mb-0">
							<h3 className="text-xl font-bold mb-2">Pedido {pedido}</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{pedido === 1 && (
									<p>Punto de Retiro: $1000 (Por ser en días pico)</p>
								)}
								<p>
									Km al Pedido {pedido}: ${pedido * 200} ({pedido} km)
								</p>
								<p>Punto de Entrega: $1000</p>
							</div>
						</div>
					))}
					<div className="mt-4 pt-4 border-t border-gray-200">
						<p>Km de vuelta al local: $1160 (5.8 km)</p>
						<p className="text-xl font-bold mt-2">
							TOTAL DE LA VUELTA: $10.060
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
