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
  Clientes,
  AnheloRiders,
  AnheloRidersStats,
  Equipo,
  WhatsappFeatures,
  ComanderaAutomatizada,
} from "../pages";
import { useRef } from "react";
import { MonthData } from "./MonthData";
import RegistroHorario from "./Notificaciones";
import { Stock } from "./Stock";
import RegistroEmpleado from "./Empleados";
import { GenerateVouchersForm } from "../components/vouchers/GenerateVouchersForm";
import { NuevaCompra } from "./NuevaCompra";
import CampañaDetalle from "./CampañaDetalle";
import { DeudaManager } from "./DeudaManager";
import FacturaForm from "../components/facturacion/FacturaForm";
import Landing from "./Landing";
import CrearEmpresa from "./CrearEmpresa";

export const DashboardMainPage = ({ backendStatus }) => {
  const scrollContainerRef = useRef(null);

  return (
    <div className="flex h-screen flex-col bg-gray-100 overflow-x-hidden">
      <Sidebar scrollContainerRef={scrollContainerRef} />
      <div
        ref={scrollContainerRef}
        className="flex-grow overflow-y-auto pt-[72px]"
      >
        <Routes>
          {/* Agrega un comodín '*' a la ruta principal */}
          <Route path="/*">
            <Route
              path="landing"
              element={<Landing scrollContainerRef={scrollContainerRef} />}
            />

            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<DynamicForm />} />
            <Route path="crearEmpresa" element={<CrearEmpresa />} />
            <Route path="comandas" element={<Comandera />} />
            <Route
              path="comanderaAutomatizada"
              element={<ComanderaAutomatizada />}
            />
            <Route path="delivery" element={<Delivery />} />
            <Route path="settings" element={<Settings />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="nuevaCompra" element={<NuevaCompra />} />
            <Route path="vouchers" element={<GenerateVouchersForm />} />
            <Route path="whatsappFeatures" element={<WhatsappFeatures />} />
            <Route
              path="facturacion"
              element={<FacturaForm backendStatus={backendStatus} />}
            />
            <Route path="stock" element={<Stock />} />
            <Route path="neto" element={<Neto />} />
            <Route path="bruto" element={<Bruto />} />
            <Route path="seguidores" element={<Seguidores />} />
            <Route path="notificaciones" element={<RegistroHorario />} />
            <Route path="campañaDetalle/:titulo" element={<CampañaDetalle />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="productosVendidos" element={<ProductosVendidos />} />
            <Route path="ventas" element={<Comandera />} />
            <Route path="registroHorario" element={<RegistroHorario />} />
            <Route path="monthdata" element={<MonthData />} />
            <Route path="empleados" element={<RegistroEmpleado />} />
            <Route path="equipo" element={<Equipo />} />
            <Route path="deudaManager" element={<DeudaManager />} />
            <Route path="AnheloRiders" element={<AnheloRiders />} />
            <Route path="anheloriders_stats" element={<AnheloRidersStats />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};
