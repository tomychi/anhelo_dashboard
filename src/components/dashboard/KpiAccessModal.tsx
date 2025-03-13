import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  obtenerEmpleadosDeEmpresa,
  updateKpiConfig,
  EmpresaProps,
  EmpleadoProps,
  getKpiConfig,
} from "../../firebase/ClientesAbsolute";

// Componente Toggle reutilizable para permisos
const TogglePermiso = ({ isOn, onToggle, label, disabled = false }) => (
  <div className="flex items-center justify-between w-full  ">
    <p className="text-xs">{label}</p>
    <div
      className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? (disabled ? "bg-gray-900" : "bg-black") : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={!disabled ? onToggle : undefined}
    >
      <div
        className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isOn ? "translate-x-6" : ""
        }`}
      />
    </div>
  </div>
);

interface KpiAccessModalProps {
  kpiKey: string;
  kpiTitle: string;
  isOpen: boolean;
  onClose: () => void;
  currentAccessIds: string[];
  onUpdate: (newAccessIds: string[]) => void;
}

export const KpiAccessModal: React.FC<KpiAccessModalProps> = ({
  kpiKey,
  kpiTitle,
  isOpen,
  onClose,
  currentAccessIds,
  onUpdate,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  const [empleados, setEmpleados] = useState<EmpleadoProps[]>([]);
  const [accessToggles, setAccessToggles] = useState<{
    [key: string]: boolean;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Obtener datos de la empresa del estado de redux
  const auth = useSelector((state: RootState) => state.auth);
  const empresa = auth.usuario;
  const tipoUsuario = auth.tipoUsuario;
  const empresaId = tipoUsuario === "empresa" ? empresa?.id : "";
  const usuarioId = empresa?.id || "";

  // Cargar empleados y configuración actual cuando se abre el modal
  useEffect(() => {
    if (isOpen && empresaId && kpiKey) {
      // Cargar empleados y luego la configuración actual
      const loadData = async () => {
        const empleadosData = await fetchEmpleados();
        await fetchCurrentAccess(empleadosData);
      };

      loadData();
    }
  }, [isOpen, empresaId, kpiKey]);

  // Configurar animación al abrir
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [isOpen]);

  // Cargar empleados activos
  const fetchEmpleados = async () => {
    setLoading(true);
    try {
      const empleadosData = await obtenerEmpleadosDeEmpresa(empresaId);
      // Filtrar solo empleados activos
      const empleadosActivos = empleadosData.filter(
        (emp) => emp.datos?.estado === "activo"
      );
      setEmpleados(empleadosActivos);
      return empleadosActivos;
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      setError("No se pudieron cargar los empleados.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Cargar configuración actual de KPIs directamente de Firestore
  const fetchCurrentAccess = async (empleadosData: EmpleadoProps[]) => {
    try {
      const config = await getKpiConfig(empresaId);

      // Obtener los IDs actuales directamente de Firestore
      const updatedAccessIds = config[kpiKey] || [];

      // Inicializar toggles con los valores actuales
      const initialToggles = {};
      empleadosData.forEach((empleado) => {
        initialToggles[empleado.id] = updatedAccessIds.includes(empleado.id);
      });

      // También incluir el toggle para el dueño/empresario
      if (usuarioId) {
        initialToggles[usuarioId] = updatedAccessIds.includes(usuarioId);

        // Asegurar que el empresario siempre tenga acceso
        if (!initialToggles[usuarioId]) {
          initialToggles[usuarioId] = true;
        }
      }

      setAccessToggles(initialToggles);
    } catch (error) {
      console.error("Error al obtener configuración actual:", error);
    }
  };

  // Gestión de arrastre para el gesto de cierre
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

  // Manejar cambios en los toggles
  const handleToggleAccess = (empleadoId) => {
    // No permitir cambios en el toggle del empresario
    if (empleadoId === usuarioId) return;

    setAccessToggles((prev) => ({
      ...prev,
      [empleadoId]: !prev[empleadoId],
    }));
  };

  // Cerrar el modal y resetear estado
  const handleClose = () => {
    setIsAnimating(false);
    setCurrentTranslate(0);
    setAccessToggles({});
    onClose();
  };

  // Guardar cambios en Firestore
  const handleSaveAccess = async () => {
    setLoading(true);

    try {
      // Obtener todos los IDs de empleados que tienen acceso habilitado
      const newAccessIds = Object.entries(accessToggles)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => id);

      // Asegurar que el usuarioId del empresario está siempre incluido
      if (usuarioId && !newAccessIds.includes(usuarioId)) {
        newAccessIds.push(usuarioId);
      }

      // Obtener configuración actual
      const currentConfig = await getKpiConfig(empresaId);

      // Crear configuración actualizada
      const updatedConfig = {
        ...currentConfig,
        [kpiKey]: newAccessIds,
      };

      // Guardar en Firestore
      await updateKpiConfig(empresaId, updatedConfig);

      // Actualizar en el componente padre
      onUpdate(newAccessIds);

      // Cerrar el modal
      handleClose();
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      setError("Ocurrió un error al guardar los permisos de acceso.");
    } finally {
      setLoading(false);
    }
  };

  // Si está cerrado, no renderizar nada
  if (!isOpen) return null;

  return (
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

        <div className="flex-col space-y-2 w-full">
          <h2 className="text-2xl mx-8  text-center font-bold mb-4">
            Visibilidad de {kpiTitle.toLocaleLowerCase()}
          </h2>

          {/* Sección para el dueño/empresario */}
          {usuarioId && (
            <TogglePermiso
              label={
                (empresa as EmpresaProps)?.datosUsuario?.nombreUsuario ||
                "Dueño"
              }
              isOn={true} // Siempre activado para el empresario
              onToggle={() => {}} // No permite cambios
              disabled={true} // Deshabilitado para no poder interactuar
            />
          )}

          {/* Sección de empleados */}
          <div className="mt-4">
            {loading ? (
              <div className="bg-gray-100 p-4 rounded-lg flex justify-center items-center h-40">
                <div className="flex flex-row gap-2">
                  <div className="w-3 h-3 bg-black rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-black rounded-full animate-pulse delay-100"></div>
                  <div className="w-3 h-3 bg-black rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            ) : empleados.length > 0 ? (
              <div className="rounded-lg max-h-60 overflow-y-auto">
                {empleados.map((empleado) => (
                  <TogglePermiso
                    key={empleado.id}
                    label={empleado.datos?.nombre || "Sin nombre"}
                    isOn={accessToggles[empleado.id] || false}
                    onToggle={() => handleToggleAccess(empleado.id)}
                  />
                ))}
              </div>
            ) : (
              <div className=" p-4 rounded-lg text-center text-gray-400 text-xs">
                No hay empleados activos
              </div>
            )}
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
              <p className="text-red-500 text-xs">{error}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSaveAccess}
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
            "Actualizar"
          )}
        </button>
      </div>
    </div>
  );
};

export default KpiAccessModal;
