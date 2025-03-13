import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { EmpresaProps, EmpleadoProps } from "../../firebase/ClientesAbsolute";
import KpiCreationModal from "./KpiCreationModal";

const AddKpiCard = ({ className = "" }) => {
  const [showModal, setShowModal] = useState(false);

  // Obtener información del usuario autenticado
  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;

  // Verificar si el usuario es empresario (administrador)
  const isEmpresario = tipoUsuario === "empresa";

  // Obtener el ID del usuario/empresa actual
  const empresaId =
    tipoUsuario === "empresa"
      ? (auth?.usuario as EmpresaProps)?.id
      : tipoUsuario === "empleado"
        ? (auth?.usuario as EmpleadoProps)?.empresaId
        : "";

  // Solo mostrar el botón si es empresario
  if (!isEmpresario) return null;

  return (
    <div
      className="bg-indigo-600 flex flex-row gap-2 rounded-b-lg items-center justify-center flex-row  font-coolvetica px-4 h-16  cursor-pointer"
      onClick={() => setShowModal(true)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 text-gray-100"
      >
        <path
          fill-rule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
          clip-rule="evenodd"
        />
      </svg>

      <p className="text-center text-2xl text-gray-100">Agregar KPI</p>

      {/* Modal para seleccionar KPI */}
      {showModal && (
        <KpiCreationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          empresaId={empresaId}
        />
      )}
    </div>
  );
};

export default AddKpiCard;
