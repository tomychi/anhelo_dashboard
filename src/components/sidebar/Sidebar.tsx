import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import Absolute from "../../assets/absoluteIsologo.avif";

export const Sidebar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const currentUserEmail = useSelector(
		(state: RootState) => state.auth?.user?.email
	);
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const toggleProfile = () => {
		setIsProfileOpen(!isProfileOpen);
	};

	const navbarHeight = "72px";

	const menuItems = isMarketingUser
		? [
				{ to: "/gastos", text: "Gastos" },
				{ to: "/vouchers", text: "2x1 Manager" },
		  ]
		: [
				{ to: "/", text: "Dashboard" },
				{ to: "/pedidos", text: "Tomar pedidos" },
				{ to: "/comandas", text: "Comandas y Grupos" },
				{ to: "/gastos", text: "Gastos" },
				{ to: "/whatsappFeatures", text: "Reactivar clientes" },
				{ to: "/vouchers", text: "Campañas de vouchers" },
				{ to: "/equipo", text: "Equipo" },
				{ to: "/clientes", text: "Comportamiento de clientes" },
				{ to: "/settings", text: "Configuración" },
		  ];

	const profileMenuItems = [
		{ to: "/perfil", text: "Mi perfil", icon: "👤" },
		{ to: "/notificaciones", text: "Notificaciones", icon: "🔔" },
		{ to: "/preferencias", text: "Preferencias", icon: "⚙️" },
	];

	return (
		<>
			<div className="flex flex-row bg-black w-full pt-4 pb-4 gap-2 justify-between px-4 relative z-30 ">
				<NavLink to={"/"} className="ml-[-3px] items-center">
					<img
						src={Absolute}
						className="h-10 filter brightness-[400] saturate-0"
						alt="Absolute Logo"
					/>
				</NavLink>
				<div className="flex flex-row items-center">
					<button
						onClick={toggleMenu}
						className="flex items-center mr-2 h-10 w-10 justify-center"
					>
						{isMenuOpen ? (
							<div className="hover:bg-white hover:bg-opacity-10 text-gray-100 h-10 w-10 rounded-full focus:outline-none transition duration-300 ease-in-out">
								<p className="font-bold font-coolvetica mt-1.5">x</p>
							</div>
						) : (
							<div className="hover:bg-white hover:bg-opacity-10 text-gray-100 h-10 w-10 flex items-center justify-center rounded-full focus:outline-none transition duration-300 ease-in-out">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth="3"
									stroke="currentColor"
									className="w-6 text-gray-100"
								>
									<path d="M3.75 9h16.5m-16.5 6.75h16.5" />
								</svg>
							</div>
						)}
					</button>

					<div className="relative">
						<button
							onClick={toggleProfile}
							className="relative bg-gray-100 h-9 w-9 rounded-full justify-center items-center flex font-coolvetica font-bold focus:outline-none transition duration-300 ease-in-out hover:bg-gray-300 cursor-pointer"
						>
							TA
							<div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
						</button>

						{/* Profile Dropdown Menu */}
						{isProfileOpen && (
							<div className="absolute right-0 mt-2 w-96 font-coolvetica bg-gray-100 rounded-lg shadow-lg overflow-hidden">
								{/* Profile Div */}
								<div className="border-b border-gray-200">
									<div className="px-4 pb-8 flex justify-center flex-col items-center pt-6">
										<div className="text-2xl font-bold">Luciano Castillo</div>
										<div className="text-xs text-gray-500">
											Jefe en contenido y ventas
										</div>
									</div>
									{/* Principales acciones */}
									<div className="grid grid-cols-3 font-bold gap-2 px-4 pb-4">
										<NavLink to="/ayuda" className="flex flex-col items-center">
											<div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
												<span role="img" aria-label="help">
													❓
												</span>
												<span className="text-xs mt-1">Ayuda</span>
											</div>
										</NavLink>
										<NavLink
											to="/billetera"
											className="flex flex-col items-center"
										>
											<div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
												<span role="img" aria-label="wallet">
													💳
												</span>
												<span className="text-xs mt-1">Billetera</span>
											</div>
										</NavLink>
										<NavLink
											to="/actividad"
											className="flex flex-col items-center"
										>
											<div className="flex items-center flex-col justify-center w-full h-20 rounded-xl bg-gray-200">
												<span role="img" aria-label="activity">
													📊
												</span>
												<span className="text-xs mt-1">Actividad</span>
											</div>
										</NavLink>
									</div>
								</div>
								{/* Profile menu items */}
								<div className="mt-4 ">
									{profileMenuItems.map((item, index) => (
										<NavLink
											key={index}
											to={item.to}
											className=" px-4 h-10 flex items-center text-xs hover:bg-gray-200"
										>
											<span className="mr-2" role="img" aria-label={item.text}>
												{item.icon}
											</span>
											{item.text}
										</NavLink>
									))}
								</div>
								{/* Cerrar sesion  */}
								<div className="mr-8">
									<button
										onClick={() => {
											/* handle logout */
										}}
										className="w-full  text-base text-red-main h-20 mt-4 font-bold ml-4 rounded-lg text-center mb-4 bg-gray-200"
									>
										Cerrar sesión
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<div
				className={`fixed left-0 w-full bg-white transition-all duration-300 ease-in-out ${
					isMenuOpen ? "z-[10000]" : "z-[-1]"
				}`}
				style={{
					top: navbarHeight,
					height: `calc(100vh - ${navbarHeight})`,
					transform: isMenuOpen ? "translateY(0)" : "translateY(-100%)",
					visibility: isMenuOpen ? "visible" : "hidden",
				}}
			>
				<nav className="pt-4 h-full px-4 overflow-y-auto">
					<ul className="flex flex-col gap-4">
						{menuItems.map((item, index) => (
							<li key={index}>
								<NavLink
									to={item.to}
									className="block text-2xl font-coolvetica font-bold"
									onClick={toggleMenu}
								>
									{item.text}
								</NavLink>
							</li>
						))}
						<p className="font-medium text-sm mt-4">
							Ⓡ 2024, Absolute Business Solutions.
						</p>
					</ul>
				</nav>
			</div>
		</>
	);
};
