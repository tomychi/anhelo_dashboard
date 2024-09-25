import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import Absolute from "../../assets/absoluteIsologo.avif";

export const Sidebar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const currentUserEmail = useSelector(
		(state: RootState) => state.auth?.user?.email
	);
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
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
				{ to: "/equipo", text: "Equipo" },
				{ to: "/vouchers", text: "Vouchers manager" },
				{ to: "/settings", text: "Configuración" },
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
						className="  flex items-center mr-2  h-10 w-10 justify-center"
					>
						{isMenuOpen ? (
							<div className="hover:bg-white hover:bg-opacity-10 text-gray-100 h-10 w-10  rounded-full focus:outline-none transition duration-300 ease-in-out">
								<p className=" font-bold font-coolvetica mt-1.5 ">x</p>
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
					{/* <button className="bg-gray-100 rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-9 focus:outline-none transition duration-300 ease-in-out hover:bg-gray-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-6 mr-1.5"
						>
							<path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256l-7.108-4.061C13.555 6.346 12 7.249 12 8.689v2.34L5.055 7.061Z" />
						</svg>

						<p className=" font-bold font-coolvetica ">Accion rapida</p>
					</button> */}
					<div className="relative bg-gray-100 h-9 w-9 ml-2 rounded-full justify-center items-center flex font-coolvetica font-bold focus:outline-none transition duration-300 ease-in-out hover:bg-gray-300 cursor-pointer">
						TA
						<div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
					</div>
				</div>
			</div>

			<div
				className={`fixed left-0 w-full bg-white transition-all duration-300 ease-in-out  ${
					isMenuOpen ? "z-[10000]" : "z-[-1]"
				}`}
				style={{
					top: navbarHeight,
					height: `calc(100vh - ${navbarHeight})`,
					transform: isMenuOpen ? "translateY(0)" : "translateY(-100%)",
					visibility: isMenuOpen ? "visible" : "hidden",
				}}
			>
				<nav className="pl-[2px] pt-6 h-full overflow-y-auto">
					<ul className="flex flex-col gap-6 px-4">
						{menuItems.map((item, index) => (
							<li key={index}>
								<NavLink
									to={item.to}
									className="block  text-4xl font-coolvetica font-bold "
									onClick={toggleMenu}
								>
									{item.text}
								</NavLink>
							</li>
						))}
						<p className="font-medium text-sm mt-12 ">
							Ⓡ 2024, Absolute Business Solutions.
						</p>
					</ul>
				</nav>
			</div>
		</>
	);
};
