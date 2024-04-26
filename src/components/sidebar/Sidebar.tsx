import { NavLink } from "react-router-dom";
import Absolute from "../../assets/absoluteIsologo.png";
import { useDispatch } from "react-redux";
import { ReadMateriales } from "../../firebase/Materiales";
import { readMaterialsAll } from "../../redux/materials/materialAction";
import { readProductsAll } from "../../redux/products/productAction";
import { calcularCostoHamburguesa } from "../../helpers/calculator";
import { ReadData } from "../../firebase/ReadData";
import { ProductStateProps } from "../../redux/products/productReducer";
import Swal from "sweetalert2";

export const Sidebar = () => {
	const dispatch = useDispatch();

	const recargarDatos = () => {
		const fetchData = async () => {
			try {
				const materialesData = await ReadMateriales();
				dispatch(readMaterialsAll(materialesData));
				const productsData = await ReadData();

				const formattedData: ProductStateProps[] = productsData.map((item) => ({
					collectionName: item.collectionName,
					id: item.id,
					data: {
						description: item.data.description,
						img: item.data.img,
						name: item.data.name,
						price: item.data.price,
						type: item.data.type,
						ingredients: item.data.ingredients,
						id: item.id,
						costo: calcularCostoHamburguesa(
							materialesData,
							item.data.ingredients
						),
					},
				}));

				dispatch(readProductsAll(formattedData));

				Swal.fire({
					icon: "success",
					title: "Datos Actualizados",
					text: "Se actualizaron productos y materiales",
				});
			} catch (error) {
				Swal.fire({
					icon: "error",
					title: "Error",
					text: `Error al traer datos: ${error}`,
				});
			}
		};

		fetchData();
	};

	return (
		<aside id="drawer-navigation" className=" top-0 left-0 z-50 w-12 h-screen ">
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
            clipRule="evenodd"
          ></path>
        </svg>
        <span className="sr-only">Close menu</span>
      </button> */}
			<div className="h-screen flex bg-custom-red flex-col p-2 gap-2">
				<>
					<NavLink
						to={"/"}
						className="flex flex-col items-center justify-center"
					>
						<img
							src={Absolute}
							className="h-6 sm:h-7 p-1 mx-auto"
							alt="absolute Logo"
						/>
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

						{/* <li>
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
						</li> */}

						<li>
							<NavLink
								to="/"
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

						<li>
							<NavLink
								to="/gastos"
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									aria-hidden="true"
									fill="currentColor"
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
								>
									<path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
									<path
										fillRule="evenodd"
										d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z"
										clipRule="evenodd"
									/>
								</svg>
							</NavLink>
						</li>

						<li>
							<NavLink
								to="/monthdata"
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
								>
									<path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
								</svg>
							</NavLink>
						</li>

						<li>
							<NavLink
								to="/stock"
								className="flex items-center p-2 text-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
								>
									<path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
									<path
										fillRule="evenodd"
										d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.163 3.75A.75.75 0 0 1 10 12h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Z"
										clipRule="evenodd"
									/>
								</svg>
							</NavLink>
						</li>
						<li>
							<NavLink
								to="/"
								className="flex items-center p-2 text-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="w-6 h-6"
								>
									<path
										fill-rule="evenodd"
										d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z"
										clip-rule="evenodd"
									/>
								</svg>
							</NavLink>
						</li>

						<li>
							<NavLink
								to="/settings"
								className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									data-slot="icon"
									className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
								>
									<path
										fillRule="evenodd"
										d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
										clipRule="evenodd"
									/>
								</svg>
							</NavLink>
						</li>
					</ul>
				</>
				<button
					onClick={() => recargarDatos()}
					className="flex items-center p-2 text-black text-black hover:bg-black hover:bg-black group mt-auto"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="w-5 h-5 text-black transition duration-75 text-black group-hover:text-black group-hover:text-custom-red"
					>
						<path
							fillRule="evenodd"
							d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</aside>
	);
};
