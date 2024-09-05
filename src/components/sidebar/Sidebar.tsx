import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import Absolute from "../../assets/absoluteIsologo.avif";
import items from "../../assets/itemsIcon.png";

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
				{ to: "/pedidos", text: "Pedidos" },
				{ to: "/comandas", text: "Comandas" },
				{ to: "/marketing", text: "Marketing" },
				{ to: "/vouchers", text: "Vouchers" },
				{ to: "/", text: "Dashboard" },
				{ to: "/empleados", text: "Empleados" },
				{ to: "/gastos", text: "Gastos" },
				{ to: "/monthdata", text: "Datos Mensuales" },
				{ to: "/stock", text: "Stock" },
				{ to: "/AnheloRiders", text: "Anhelo Riders" },
				{ to: "/settings", text: "Configuración" },
		  ];

	return (
		<>
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
						<p className=" font-medium">Acción rapida</p>
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
				<nav className="pl-2 pt-2 h-full overflow-y-auto">
					<ul className="gap-4">
						{menuItems.map((item, index) => (
							<li key={index}>
								<NavLink
									to={item.to}
									className="block p-2 hover:bg-gray-300 rounded "
									onClick={toggleMenu}
								>
									{item.text}
								</NavLink>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</>
	);
};
