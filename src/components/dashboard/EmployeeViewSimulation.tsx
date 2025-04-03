import React, { useState, useEffect, useRef } from "react";
import { obtenerEmpleadosDeEmpresa } from "../../firebase/ClientesAbsolute";
import Swal from "sweetalert2";
import arrowIcon from "../../assets/arrowIcon.png";

const EmployeeViewSimulation = ({ empresaId, onSimulateView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch employees when the modal opens
  useEffect(() => {
    if (isOpen && empresaId) {
      fetchEmployees();
    }
  }, [isOpen, empresaId]);

  // Configure animation when opening
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const employeesList = await obtenerEmpleadosDeEmpresa(empresaId);
      setEmployees(
        employeesList.filter((emp) => emp.datos?.estado === "activo")
      );
      setError("");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("No se pudieron cargar los empleados");
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

    // Find the selected employee's data
    const selectedEmployeeData = employees.find(
      (emp) => emp.id === selectedEmployee
    );

    // Call the parent component's onSimulateView function
    onSimulateView(selectedEmployee, selectedEmployeeData);

    // Success notification
    Swal.fire({
      icon: "success",
      title: "Simulación iniciada",
      text: `Ahora estás viendo el dashboard como ${selectedEmployeeData?.datos?.nombre || "empleado"}`,
      timer: 2000,
      showConfirmButton: false,
    });

    // Close the modal
    handleClose();
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setCurrentTranslate(0);
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  // Drag gesture handling
  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleMouseDown = (e) => {
    setDragStart(e.clientY);
  };

  const handleTouchMove = (e) => {
    if (dragStart === null) return;
    const currentPosition = e.touches[0].clientY;
    const difference = currentPosition - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleMouseMove = (e) => {
    if (dragStart === null) return;
    const difference = e.clientY - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleDragEnd = () => {
    if (currentTranslate > 200) {
      handleClose();
    } else {
      setCurrentTranslate(0);
    }
    setDragStart(null);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragStart !== null) {
        handleDragEnd();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragStart, currentTranslate]);

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 text-gray-100 cursor-pointer hover:text-gray-300"
        onClick={handleOpen}
      >
        <path
          fillRule="evenodd"
          d="M10.47 2.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H5.75a.75.75 0 0 1 0-1.5h5.69l-.97-.97a.75.75 0 0 1 0-1.06Zm-4.94 6a.75.75 0 0 1 0 1.06l-.97.97h5.69a.75.75 0 0 1 0 1.5H4.56l.97.97a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
              isAnimating ? "bg-opacity-50" : "bg-opacity-0"
            }`}
            style={{
              opacity: Math.max(0, 1 - currentTranslate / 400),
            }}
            onClick={handleClose}
          />

          <div
            ref={modalRef}
            className={`relative bg-white w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-10 transition-transform duration-300 touch-none ${
              isAnimating ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
              transform: `translateY(${currentTranslate}px)`,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-1 bg-gray-200 rounded-full" />
              </div>
            </div>

            <div className="flex-col w-full">
              <div className="mb-8">
                <h2 className="text-2xl mx-8 text-center font-bold mb-4">
                  Simular vista
                </h2>
              </div>

              {/* Employee selection section */}
              {loading ? (
                <div className="text-center py-4">
                  <div className="flex justify-center w-full items-center">
                    <div className="flex flex-row gap-1">
                      <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-500 text-xs">{error}</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay empleados disponibles
                </div>
              ) : (
                // Use a wrapper div to position both the select and the arrow
                <div className="relative w-full">
                  <select
                    className="w-full px-4 h-10 border border-gray-300 rounded-full text-sm appearance-none"
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
                  {/* Position the arrow absolutely within the wrapper */}
                  <img
                    src={arrowIcon}
                    className="absolute right-4 transform rotate-90 h-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
                    alt="Select arrow"
                  />
                </div>
              )}

              {/* Action buttons */}
              <button
                onClick={handleSimulateView}
                disabled={loading || !selectedEmployee}
                className="text-gray-100 w-full mt-12 text-4xl h-20 px-4 bg-black font-bold rounded-3xl outline-none"
              >
                {loading ? (
                  <div className="flex justify-center w-full items-center">
                    <div className="flex flex-row gap-1">
                      <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                ) : (
                  "Ver"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeViewSimulation;
