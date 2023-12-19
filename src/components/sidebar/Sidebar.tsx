import { NavLink } from "react-router-dom";
import Logo from "../../assets/anheloLogo.png";

export const Sidebar = () => {
	return (
		<aside
			id="drawer-navigation"
			className=" top-0 left-0 z-50 w-12 h-screen transition-transform  sm:translate-x-0 bg-gray-50 bg-gray-800"
		>
			{/* <button
        type="button"
        data-drawer-hide="drawer-navigation"
        aria-controls="drawer-navigation"
        className="texk-black 400 bg-transparent hover:bg-gray-200 hover:texk-black 900 -lg text-sm p-1.5 absolute top-2.5 right-2.5 inline-flex items-center hover:bg-gray-600 hover:text-black"
      >
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <span className="sr-only">Close menu</span>
      </button> */}
			<div className="h-full flex bg-custom-red flex-col p-2 justify-between">
				<>
					<NavLink to={"/"} className="flex items-center justify-center">
						<img src={Logo} className="h-6 sm:h-7 mx-auto" alt="anhelo Logo" />
					</NavLink>
				</>

				<>
					<ul className="space-y-2 font-medium">
						<li>
							<NavLink
								to={"/pedidos"}
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 18 21"
								>
									<path d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z" />
								</svg>
							</NavLink>
						</li>
						<li>
							<NavLink
								to={"/comandas"}
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
								>
									<path
										fillRule="evenodd"
										d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 01-.375.65 2.249 2.249 0 000 3.898.75.75 0 01.375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 17.625v-3.026a.75.75 0 01.374-.65 2.249 2.249 0 000-3.898.75.75 0 01-.374-.65V6.375zm15-1.125a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0v.75a.75.75 0 001.5 0v-.75zm-.75 3a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0v-.75a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0V18a.75.75 0 001.5 0v-.75zM6 12a.75.75 0 01.75-.75H12a.75.75 0 010 1.5H6.75A.75.75 0 016 12zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z"
										clipRule="evenodd"
									/>
								</svg>
							</NavLink>
						</li>

						<li>
							<NavLink
								to="/delivery"
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
								>
									<path
										fillRule="evenodd"
										d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
										clipRule="evenodd"
									/>
								</svg>
							</NavLink>
						</li>

						<li>
							<NavLink
								to="/map"
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
								>
									<path
										fillRule="evenodd"
										d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z"
										clipRule="evenodd"
									/>
								</svg>
							</NavLink>
						</li>
						<li>
							<NavLink
								to="/dashboard"
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 22 21"
								>
									<path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
									<path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
								</svg>
							</NavLink>
						</li>
					</ul>
				</>
			</div>
		</aside>
	);
};
