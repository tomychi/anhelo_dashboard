import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export const AnheloRidersStats = () => {
	const navigate = useNavigate();
	const [isArrowRotated, setIsArrowRotated] = useState(false);

	const handleVolverClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsArrowRotated(true);
		setTimeout(() => {
			setIsArrowRotated(false);
			navigate("/anheloriders");
		}, 500);
	};

	return (
		<div className="bg-red-main min-h-screen text-black font-antonio">
			<div className="container mx-auto p-4">
				<NavLink
					to="/anheloriders"
					className="flex items-center mb-6 text-black"
					onClick={handleVolverClick}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="1.5"
						stroke="currentColor"
						className={`w-6 h-6 mr-2 transition-transform duration-500 ${
							isArrowRotated ? "rotate-0" : "rotate-180"
						}`}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
					<span className="text-sm font-black uppercase">Volver</span>
				</NavLink>

				<div className="flex flex-col  mb-8">
					<h1 className="text-6xl font-black">NIVEL 2:</h1>

					<p>
						Capaz de sacar máximo 4 pedidos por vuelta sin descuidar la entrega.
					</p>
					<div className="flex flex-row gap-4 border-2 mt-4 justify-between p-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-16 text-white"
						>
							<path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
							<path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
							<path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
							<path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
						</svg>

						<p className="mt-2 text-white">
							En el siguiente nivel se te habilitaran máximo 5 pedidos por
							vuelta.
						</p>
					</div>
				</div>

				<div className="bg-black text-red-main   shadow-lg mb-6">
					<div className="flex flex-row items-center gap-2 ">
						<div className="flex flex-row items-baseline gap-1 pl-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="h-3"
							>
								<path d="M20 4L4 20M4 4v16h16" />
							</svg>

							<h2 className="text-2xl font-bold uppercase pr-4 py-4">
								Estadísticas Principales
							</h2>
						</div>
						<div className="bg-red-main h-0.5 flex-grow" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 pb-4">
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

				<div className="bg-black text-red-main p-4  shadow-lg mb-6">
					<h2 className="text-2xl font-bold mb-4 uppercase">
						Resumen de Actividad
					</h2>
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

				<div className="bg-black text-red-main p-4  ">
					<h2 className="text-2xl font-bold mb-4 uppercase">
						Desglose de Paga
					</h2>
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
