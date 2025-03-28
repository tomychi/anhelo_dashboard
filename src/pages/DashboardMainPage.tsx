import { Routes, Route } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import {
  DynamicForm,
  Settings,
  Dashboard,
  Gastos,
  Bruto,
  Seguidores,
  ProductosVendidos,
  Clientes,
  Equipo,
  WhatsappFeatures,
  ComanderaAutomatizada,
  FormMaterial,
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
import PrivateRoutesLayout from "../layouts/PrivateRoutesLayout";
import { PeñonDelAguila } from "./PeñonDelAguila";

export const DashboardMainPage = () => {
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
              index
              element={<Landing scrollContainerRef={scrollContainerRef} />}
            />
            <Route
              path="dashboard"
              element={
                <PrivateRoutesLayout>
                  <Dashboard />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="pedidos"
              element={
                <PrivateRoutesLayout>
                  <DynamicForm />
                </PrivateRoutesLayout>
              }
            />{" "}
            <Route path="peñonDelAguila" element={<PeñonDelAguila />} />{" "}
            <Route
              path="paginaDeVentas"
              element={
                <PrivateRoutesLayout>
                  <FormMaterial />
                </PrivateRoutesLayout>
              }
            />
            <Route path="crearEmpresa" element={<CrearEmpresa />} />
            <Route
              path="comanderaAutomatizada"
              element={
                <PrivateRoutesLayout>
                  <ComanderaAutomatizada />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="settings"
              element={
                <PrivateRoutesLayout>
                  <Settings />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="gastos"
              element={
                <PrivateRoutesLayout>
                  <Gastos />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="nuevaCompra"
              element={
                <PrivateRoutesLayout>
                  <NuevaCompra />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="vouchers"
              element={
                <PrivateRoutesLayout>
                  <GenerateVouchersForm />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="whatsappFeatures"
              element={
                <PrivateRoutesLayout>
                  <WhatsappFeatures />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="facturacion"
              element={
                <PrivateRoutesLayout>
                  <FacturaForm />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="stock"
              element={
                <PrivateRoutesLayout>
                  <Stock />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="bruto"
              element={
                <PrivateRoutesLayout>
                  <Bruto />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="seguidores"
              element={
                <PrivateRoutesLayout>
                  <Seguidores />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="notificaciones"
              element={
                <PrivateRoutesLayout>
                  <RegistroHorario />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="campañaDetalle/:titulo"
              element={
                <PrivateRoutesLayout>
                  <CampañaDetalle />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="clientes"
              element={
                <PrivateRoutesLayout>
                  <Clientes />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="productosVendidos"
              element={
                <PrivateRoutesLayout>
                  <ProductosVendidos />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="ventas"
              element={
                <PrivateRoutesLayout>
                  <ComanderaAutomatizada />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="registroHorario"
              element={
                <PrivateRoutesLayout>
                  <RegistroHorario />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="monthdata"
              element={
                <PrivateRoutesLayout>
                  <MonthData />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="empleados"
              element={
                <PrivateRoutesLayout>
                  <RegistroEmpleado />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="equipo"
              element={
                <PrivateRoutesLayout>
                  <Equipo />
                </PrivateRoutesLayout>
              }
            />
            <Route
              path="deudaManager"
              element={
                <PrivateRoutesLayout>
                  <DeudaManager />
                </PrivateRoutesLayout>
              }
            />
          </Route>
        </Routes>
      </div>
    </div>
  );
};
