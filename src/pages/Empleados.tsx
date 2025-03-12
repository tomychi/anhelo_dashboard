import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { crearEmpleado } from "../firebase/ClientesAbsolute";

// Componente Toggle reutilizable para permisos
const TogglePermiso = ({ isOn, onToggle, label }) => (
  <div className="flex items-center justify-between w-full py-2 border-b border-gray-200">
    <p className="text-sm">{label}</p>
    <div
      className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? "bg-black" : "bg-gray-300"
      }`}
      onClick={onToggle}
    >
      <div
        className={`bg-gray-100 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isOn ? "translate-x-6" : ""
        }`}
      />
    </div>
  </div>
);

export const Empleados = () => {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [rol, setRol] = useState("");
  const [salario, setSalario] = useState<number | undefined>(undefined);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [empleados, setEmpleados] = useState([]);

  // Modal drag states
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  // Obtener datos de la empresa del estado de redux
  const auth = useSelector((state: RootState) => state.auth);
  const empresa = auth.usuario;
  const tipoUsuario = auth.tipoUsuario;
  const empresaId = tipoUsuario === "empresa" ? empresa?.id : "";

  // Obtener los features disponibles para usar como permisos
  const featuresDisponibles =
    tipoUsuario === "empresa" ? empresa?.featuresIniciales || [] : [];

  // Inicializar los toggles de permisos
  const [permisosToggles, setPermisosToggles] = useState({});

  useEffect(() => {
    if (featuresDisponibles.length > 0) {
      const initialToggles = {};
      featuresDisponibles.forEach((feature) => {
        initialToggles[feature] = false;
      });
      setPermisosToggles(initialToggles);
    }
  }, [featuresDisponibles]);

  // Efecto para cargar empleados al montar el componente
  useEffect(() => {
    if (empresaId) {
      fetchEmpleados();
    }
  }, [empresaId]);

  const fetchEmpleados = async () => {
    try {
      // Aquí implementarás la lógica para obtener empleados desde Firestore
      // por ahora lo dejamos como un array vacío
      setEmpleados([]);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
    }
  };

  useEffect(() => {
    if (showForm) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [showForm]);

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
      handleCloseForm();
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

  const handleTogglePermiso = (permiso) => {
    setPermisosToggles((prev) => ({
      ...prev,
      [permiso]: !prev[permiso],
    }));
  };

  const handleCreateEmpleado = async () => {
    // Validar campos
    if (!nombre || !telefono || !contraseña || !rol) {
      setError("Por favor, completa todos los campos obligatorios");
      return;
    }

    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!empresaId) {
      setError("No se encontró información de la empresa");
      return;
    }

    // Obtener los permisos seleccionados
    const permisosSeleccionados = Object.keys(permisosToggles).filter(
      (key) => permisosToggles[key]
    );

    if (permisosSeleccionados.length === 0) {
      setError("Selecciona al menos un permiso");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await crearEmpleado(
        empresaId,
        nombre,
        telefono,
        contraseña,
        rol,
        permisosSeleccionados,
        salario || 0
      );

      // Limpiar el formulario y cerrar
      handleCloseForm();

      // Recargar la lista de empleados
      fetchEmpleados();
    } catch (error) {
      console.error("Error al crear empleado:", error);
      setError("Error al crear el empleado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setNombre("");
    setTelefono("");
    setContraseña("");
    setConfirmarContraseña("");
    setRol("");
    setSalario(undefined);

    // Resetear todos los toggles de permisos
    const resetToggles = {};
    Object.keys(permisosToggles).forEach((key) => {
      resetToggles[key] = false;
    });
    setPermisosToggles(resetToggles);

    setError("");
    setCurrentTranslate(0);
    setIsAnimating(false);
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 pb-8">
        <p className="text-black font-bold text-4xl mt-1">Empleados</p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gray-300 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6"
          >
            <path
              fillRule="evenodd"
              d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          <p className="font-bold">Nuevo empleado</p>
        </button>
      </div>

      {/* Modal para crear nuevo empleado */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
              isAnimating ? "bg-opacity-50" : "bg-opacity-0"
            }`}
            style={{
              opacity: Math.max(0, 1 - currentTranslate / 400),
            }}
            onClick={handleCloseForm}
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
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
            </div>

            <div className="mt-4 flex-col space-y-2 w-full">
              <h2 className="text-2xl font-bold mb-4">Nuevo empleado</h2>

              <input
                type="text"
                placeholder="Nombre y apellido"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="tel"
                placeholder="Número de teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="text"
                placeholder="Rol o puesto"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="number"
                placeholder="Salario (opcional)"
                value={salario || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSalario(value === "" ? undefined : parseInt(value, 10));
                }}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              {/* Sección de permisos */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Permisos</h3>
                <div className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {featuresDisponibles.map((feature) => (
                    <TogglePermiso
                      key={feature}
                      label={feature}
                      isOn={permisosToggles[feature] || false}
                      onToggle={() => handleTogglePermiso(feature)}
                    />
                  ))}

                  {/* Permisos adicionales */}
                  <TogglePermiso
                    label="Dashboard"
                    isOn={permisosToggles["Dashboard"] || false}
                    onToggle={() => handleTogglePermiso("Dashboard")}
                  />
                  <TogglePermiso
                    label="Ventas"
                    isOn={permisosToggles["Ventas"] || false}
                    onToggle={() => handleTogglePermiso("Ventas")}
                  />
                  <TogglePermiso
                    label="Gastos"
                    isOn={permisosToggles["Gastos"] || false}
                    onToggle={() => handleTogglePermiso("Gastos")}
                  />
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                  <p className="text-red-500 text-xs">{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateEmpleado}
              disabled={loading}
              className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-lg outline-none"
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
                "Crear empleado"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lista de empleados */}
      <div className="mx-4">
        {empleados.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">No hay empleados registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Aquí se mostrarán los empleados cuando implementes la función
                para obtenerlos de la base de datos */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Empleados;
