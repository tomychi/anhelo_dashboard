import { Routes, Route } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import {
	DynamicForm,
	Comandera,
	Delivery,
	Settings,
	Dashboard,
	Gastos,
	Neto,
	Bruto,
	Seguidores,
	ProductosVendidos,
} from "../pages";
import { MonthData } from "./MonthData";
import { Stock } from "./Stock";

export const DashboardMainPage = () => {
	return (
		<div className="flex h-screen bg-black overflow-x-hidden">
			<Sidebar />
			<div className="flex-grow overflow-y-auto">
				<Routes>
					{/* Agrega un comodín '*' a la ruta principal */}
					<Route path="/*">
						<Route index element={<Dashboard />} />
						<Route path="pedidos" element={<DynamicForm />} />
						<Route path="comandas" element={<Comandera />} />
						<Route path="delivery" element={<Delivery />} />
						<Route path="settings" element={<Settings />} />
						<Route path="gastos" element={<Gastos />} />
						<Route path="stock" element={<Stock />} />
						<Route path="neto" element={<Neto />} />
						<Route path="bruto" element={<Bruto />} />
						<Route path="seguidores" element={<Seguidores />} />
						<Route path="productosVendidos" element={<ProductosVendidos />} />
						<Route path="ventas" element={<Comandera />} />
						<Route path="monthdata" element={<MonthData />} />
					</Route>
				</Routes>
			</div>
		</div>
	);
};
