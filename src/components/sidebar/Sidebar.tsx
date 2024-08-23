import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Absolute from "../../assets/absoluteIsologo.avif";
import items from "../../assets/itemsIcon.png";

export const Sidebar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const navbarHeight = "72px"; // Ajusta esto al alto exacto de tu navbar

	return (
		<div className="relative">
			<div className="flex flex-row bg-black w-full pt-4 pb-4 gap-2 justify-between px-4 relative z-30">
				<NavLink to={"/"} className="ml-[-3px] items-center">
					<img
						src={Absolute}
						className="h-10 filter brightness-[400] saturate-0"
						alt="Absolute Logo"
					/>
				</NavLink>
				<div className="flex flex-row gap-4 items-center">
					<button className="bg-gray-100 rounded-md flex items-center pt-3 pb-4 pl-3 pr-4 h-9">
						<p className="text-xs font-bold">Acción rapida</p>
					</button>
					<button
						onClick={toggleMenu}
						className="bg-gray-100 rounded-md flex items-center px-2 h-9 w-9 justify-center"
					>
						{isMenuOpen ? (
							<p className="mt-[-5px] font-black">×</p>
						) : (
							<img src={items} alt="Menu" className="h-3 object-contain" />
						)}
					</button>
				</div>
			</div>

			{/* Menú desplegable */}
			<div
				className={`absolute left-0 w-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
					isMenuOpen ? "translate-y-0" : "-translate-y-full"
				}`}
				style={{
					top: navbarHeight,
					height: `calc(100vh - ${navbarHeight})`,
					zIndex: 20,
				}}
			>
				<nav className="pl-2 pt-2 h-full overflow-y-auto">
					<ul className="gap-4">
						{[
							{ to: "/pedidos", text: "Pedidos" },
							{ to: "/comandas", text: "Comandas" },
							{ to: "/", text: "Dashboard" },
							{ to: "/empleados", text: "Empleados" },
							{ to: "/gastos", text: "Gastos" },
							{ to: "/monthdata", text: "Datos Mensuales" },
							{ to: "/stock", text: "Stock" },
							{ to: "/AnheloRiders", text: "Anhelo Riders" },
							{ to: "/settings", text: "Configuración" },
						].map((item, index) => (
							<li key={index}>
								<NavLink
									to={item.to}
									className="block p-2 hover:bg-gray-200 rounded text-sm"
									onClick={toggleMenu}
								>
									{item.text}
								</NavLink>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</div>
	);
};
