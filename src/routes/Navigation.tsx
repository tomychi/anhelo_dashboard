import { HashRouter, Route, Routes } from "react-router-dom";
import {
	Comandera,
	Dashboard,
	Delivery,
	DynamicForm,
	MapStats,
} from "../pages";
import { Sidebar } from "../components/sidebar";

export const Navigation = () => {
	return (
		<HashRouter basename={"/"}>
			<div className="flex h-screen bg-black overflow-x-hidden">
				{/* Contenedor principal con display flex */}

				<Sidebar />
				<div className="flex-grow overflow-y-auto">
					{/* Este div se expandirá para ocupar el espacio restante y permitirá el scroll */}
					<Routes>
						<Route path="/pedidos" element={<DynamicForm />} />
						<Route path="/comandas" element={<Comandera />} />
						<Route path="/delivery" element={<Delivery />} />
						<Route path="/map" element={<MapStats />} />
						<Route path="/dashboard" element={<Dashboard />} />
						{/* <Route path="/page2" element={<Page2 />} /> */}
						{/* more... */}
					</Routes>
				</div>
			</div>
		</HashRouter>
	);
};
