import { Outlet, useLocation, Navigate, Route, Routes } from "react-router-dom";
import { projectAuth } from "../firebase/config";
import { Comandera, ComanderaAutomatizada, Dashboard, Equipo } from "../pages";
import { Sidebar } from "../components/sidebar";
import { NuevaCompra } from "../pages/NuevaCompra";
import { GenerateVouchersForm } from "../components/vouchers/GenerateVouchersForm";
import RegistroHorario from "../pages/RegistroHorario";

export const PrivateRoutesLayout = () => {
	const location = useLocation();
	const currentUserEmail = projectAuth.currentUser?.email;

	// Lista de correos con acceso limitado a Comandas
	const limitedAccessEmails = [
		"cadetes@anhelo.com",
		"cocina@anhelo.com",
		"mostrador@anhelo.com",
	];

	if (!projectAuth.currentUser) {
		// Si no hay usuario autenticado, redirige al login
		return <Navigate to="/authentication" state={{ from: location }} replace />;
	}

	// Acceso completo para tomas.arcostanzo5@gmail.com
	if (currentUserEmail === "tomas.arcostanzo5@gmail.com") {
		return <Outlet />;
	}

	// Acceso a Marketing para marketing@anhelo.com
	if (currentUserEmail === "marketing@anhelo.com") {
		return (
			<div className="flex h-screen flex-col bg-gray-100 overflow-x-hidden">
				<Sidebar />
				<div className="flex-grow overflow-y-auto">
					<Routes>
						{/* Agrega un comodín '*' a la ruta principal */}
						<Route index element={<Dashboard />} />
						<Route path="nuevaCompra" element={<NuevaCompra />} />
						<Route path="vouchers" element={<GenerateVouchersForm />} />
						<Route path="equipo" element={<Equipo />} />

						<Route path="registroHorario" element={<RegistroHorario />} />
					</Routes>
				</div>
			</div>
		);
	}

	// Acceso limitado a Comandas para los usuarios en limitedAccessEmails
	if (currentUserEmail && limitedAccessEmails.includes(currentUserEmail)) {
		return (
			<Routes>
				<Route path="/comandas" element={<Comandera />} />
				<Route path="/*" element={<Navigate to="/comandas" />} />
			</Routes>
		);
	}

	// Para cualquier otro caso (acceso predeterminado)
	return (
		<Routes>
			<Route path="/comandas" element={<Comandera />} />
			<Route path="/comanderaAutomatizada" element={<ComanderaAutomatizada />} />
			<Route path="/*" element={<Navigate to="/comandas" />} />
		</Routes>
	);
};
