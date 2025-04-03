import React, { useState, useEffect } from "react";
import { obtenerEmpleadosDeEmpresa } from "../../firebase/ClientesAbsolute";
import Swal from "sweetalert2";

const EmployeeViewSimulation = ({ empresaId }) => {
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch employees when the modal opens
  useEffect(() => {
    if (showModal && empresaId) {
      fetchEmployees();
    }
  }, [showModal, empresaId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const employeesList = await obtenerEmpleadosDeEmpresa(empresaId);
      setEmployees(
        employeesList.filter((emp) => emp.datos?.estado === "activo")
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los empleados",
      });
      setLoading(false);
    }
  };

  const handleEmployeeChange = (event) => {
    setSelectedEmployee(event.target.value);
  };

  const handleSimulateView = () => {
    if (!selectedEmployee) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona un empleado",
        text: "Debes seleccionar un empleado para simular su vista",
      });
      return;
    }

    // Handle employee view simulation logic here
    Swal.fire({
      icon: "success",
      title: "Simulación iniciada",
      text: `Ahora estás viendo el dashboard como ${employees.find((emp) => emp.id === selectedEmployee)?.datos?.nombre || "empleado"}`,
      timer: 2000,
      showConfirmButton: false,
    });

    // Close the modal
    setShowModal(false);
  };

  const handleClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 text-gray-100 cursor-pointer hover:text-gray-300"
        onClick={handleClick}
      >
        <path
          fillRule="evenodd"
          d="M10.47 2.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H5.75a.75.75 0 0 1 0-1.5h5.69l-.97-.97a.75.75 0 0 1 0-1.06Zm-4.94 6a.75.75 0 0 1 0 1.06l-.97.97h5.69a.75.75 0 0 1 0 1.5H4.56l.97.97a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Simular vista de empleado</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecciona un empleado:
              </label>

              {loading ? (
                <div className="text-center py-2">Cargando empleados...</div>
              ) : employees.length === 0 ? (
                <div className="text-center py-2 text-gray-500">
                  No hay empleados disponibles
                </div>
              ) : (
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.datos?.nombre || "Sin nombre"} -{" "}
                      {employee.datos?.rol || "Sin rol"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={handleCloseModal}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                onClick={handleSimulateView}
                disabled={loading || !selectedEmployee}
              >
                Simular vista
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeViewSimulation;
