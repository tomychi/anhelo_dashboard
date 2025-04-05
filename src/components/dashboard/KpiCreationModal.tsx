import React, { useState, useEffect, useRef } from "react";
import {
  updateKpiConfig,
  getKpiConfig,
  obtenerEmpleadosDeEmpresa,
} from "../../firebase/ClientesAbsolute";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import arrowIcon from "../../assets/arrowIcon.png"; // Make sure to import the arrow icon

interface KpiCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: string;
}

// Definición de todos los KPIs predefinidos disponibles
const AVAILABLE_KPIS = [
  { key: "bruto", title: "Facturación bruta" },
  { key: "neto", title: "Facturación neta" },
  { key: "productos", title: "Productos vendidos" },
  { key: "delivery", title: "Ventas delivery" },
  { key: "takeaway", title: "Ventas take away" },
  { key: "priceFactor", title: "Extra por Dynamic price" },
  { key: "extraOrders", title: "Pedidos con extras al final" },
  { key: "extraProducts", title: "Productos extra al final" },
  { key: "extraFacturacion", title: "Facturación por extras" },
  { key: "canceledAmount", title: "Facturación bruta cancelada" },
  { key: "canceledNetAmount", title: "Facturación neta cancelada" },
  { key: "canceledProducts", title: "Productos cancelados" },
  { key: "canceledDelivery", title: "Ventas delivery canceladas" },
  { key: "canceledTakeaway", title: "Ventas take away canceladas" },
  { key: "success", title: "Customer success" },
  { key: "express", title: "Envio express" },
  { key: "coccion", title: "Tiempo cocción promedio" },
  { key: "entrega", title: "Tiempo total promedio" },
  { key: "km", title: "Km recorridos" },
  { key: "costokm", title: "Costo promedio delivery" },
  { key: "clientes", title: "Nuevos clientes" },
  { key: "ticket", title: "Ticket promedio" },
  { key: "general", title: "Rating general" },
  { key: "temperatura", title: "Temperatura" },
  { key: "presentacion", title: "Presentación" },
  { key: "pagina", title: "Página" },
  { key: "tiempo", title: "Tiempo" },
  { key: "productos-rating", title: "Productos (Rating)" },
];

// Componente Toggle reutilizable para selección de empleados
const ToggleEmpleado = ({ isOn, onToggle, label, disabled = false }) => (
  <div className="flex items-center justify-between w-full py-2 border-b border-gray-200">
    <p className="text-xs">{label}</p>
    <div
      className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer ${
        disabled ? "bg-gray-400" : isOn ? "bg-black" : "bg-gray-200"
      }`}
      onClick={disabled ? undefined : onToggle}
    >
      <div
        className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isOn ? "translate-x-6" : ""
        }`}
      />
    </div>
  </div>
);

const KpiCreationModal: React.FC<KpiCreationModalProps> = ({
  isOpen,
  onClose,
  empresaId,
}) => {
  // Estado para controlar los pasos (1: Selección de KPIs, 2: Asignación de empleados)
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpleados, setSelectedEmpleados] = useState<string[]>([]);
  const [allEmpleados, setAllEmpleados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [existingKpis, setExistingKpis] = useState<string[]>([]);
  const [filteredKpis, setFilteredKpis] = useState(AVAILABLE_KPIS);
  const [error, setError] = useState("");

  // Estados para el arrastre del modal
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  // Estados para el scroll
  const [isScrollNeeded, setIsScrollNeeded] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const kpiScrollContainerRef = useRef(null);

  // Obtener información del usuario para añadirlo automáticamente
  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;
  const usuarioId = tipoUsuario === "empresa" ? auth?.usuario?.id : "";

  // Evitar comportamiento predeterminado de Ctrl+S
  useEffect(() => {
    const preventSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", preventSave);
    return () => {
      window.removeEventListener("keydown", preventSave);
    };
  }, []);

  // Filtrar KPIs según el término de búsqueda
  useEffect(() => {
    const filtered = AVAILABLE_KPIS.filter(
      (kpi) =>
        !existingKpis.includes(kpi.key) && // No mostrar KPIs ya configurados
        (kpi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          kpi.key.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredKpis(filtered);
  }, [searchTerm, existingKpis]);

  // Efecto para detectar si se necesita scroll en la lista de KPIs
  useEffect(() => {
    if (isOpen && kpiScrollContainerRef.current) {
      const checkIfScrollNeeded = () => {
        const container = kpiScrollContainerRef.current;
        if (container) {
          setIsScrollNeeded(container.scrollHeight > container.clientHeight);
        }
      };

      checkIfScrollNeeded();
      window.addEventListener("resize", checkIfScrollNeeded);

      return () => {
        window.removeEventListener("resize", checkIfScrollNeeded);
      };
    } else {
      setIsScrollNeeded(false);
      setIsNearBottom(false);
    }
  }, [isOpen, filteredKpis]);

  // Función para manejar el evento de scroll
  const handleKpiScroll = () => {
    const container = kpiScrollContainerRef.current;
    if (container) {
      const scrollBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsNearBottom(scrollBottom < 20);
    }
  };

  useEffect(() => {
    // Cargar empleados de la empresa y KPIs existentes
    const loadData = async () => {
      if (!empresaId) return;

      setIsLoading(true);
      setError("");

      try {
        // Cargar empleados
        const empleados = await obtenerEmpleadosDeEmpresa(empresaId);
        setAllEmpleados(empleados);

        // Cargar configuración de KPIs existentes
        const kpiConfig = await getKpiConfig(empresaId);
        setExistingKpis(Object.keys(kpiConfig || {}));

        // Filtrar la lista de KPIs disponibles
        const filtered = AVAILABLE_KPIS.filter(
          (kpi) => !Object.keys(kpiConfig || {}).includes(kpi.key)
        );
        setFilteredKpis(filtered);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar los datos. Intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }

      // Añadir automáticamente al empresario a los seleccionados
      if (usuarioId) {
        setSelectedEmpleados([usuarioId]);
      }
    };

    if (isOpen) {
      loadData();
      setIsAnimating(true);
      setCurrentTranslate(0);
      // Reiniciar al paso 1 cuando se abre el modal
      setCurrentStep(1);
    }
  }, [isOpen, empresaId, usuarioId]);

  // Función para continuar al siguiente paso
  const handleContinue = () => {
    if (selectedKpis.length === 0) {
      setError("Por favor selecciona al menos un KPI");
      return;
    }
    setError("");
    setCurrentStep(2);
  };

  // Función para volver al paso anterior
  const handlePrevious = () => {
    setCurrentStep(1);
    setError("");
  };

  // Función para enviar los datos finales
  const handleSubmit = async () => {
    if (selectedKpis.length === 0 || !empresaId) {
      setError("Por favor selecciona al menos un KPI");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Obtener configuración actual de KPIs
      const currentConfig = await getKpiConfig(empresaId);

      // Crear un objeto con todas las nuevas configuraciones
      const newKpiConfigs = {};
      selectedKpis.forEach((kpiKey) => {
        newKpiConfigs[kpiKey] = selectedEmpleados;
      });

      // Añadir nuevos KPIs a la configuración
      const updatedConfig = {
        ...currentConfig,
        ...newKpiConfigs,
      };

      // Guardar configuración actualizada
      await updateKpiConfig(empresaId, updatedConfig);

      // Cerrar modal
      handleCloseModal();
    } catch (error) {
      console.error("Error al añadir KPIs:", error);
      setError("Error al añadir KPIs. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Usando la misma lógica que en CrearEmpresa
  const toggleKpi = (kpiKey) => {
    if (selectedKpis.includes(kpiKey)) {
      setSelectedKpis(selectedKpis.filter((key) => key !== kpiKey));
    } else {
      setSelectedKpis([...selectedKpis, kpiKey]);
    }
  };

  const handleToggleEmpleado = (empleadoId) => {
    setSelectedEmpleados((prev) =>
      prev.includes(empleadoId)
        ? prev.filter((id) => id !== empleadoId)
        : [...prev, empleadoId]
    );
  };

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
      handleCloseModal();
    } else {
      setCurrentTranslate(0);
    }
    setDragStart(null);
  };

  const handleCloseModal = () => {
    onClose();
    setSelectedKpis([]);
    setSearchTerm("");
    setSelectedEmpleados(usuarioId ? [usuarioId] : []);
    setError("");
    setCurrentTranslate(0);
    setIsAnimating(false);
    setCurrentStep(1);
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

  if (!isOpen) return null;

  // Añadir estilos para la animación de la barra de progreso
  const progressBarStyles = `
    @keyframes loadingBar {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: 200px 0;
      }
    }

    .animated-loading {
      background: linear-gradient(
        to right,
        #000 0%,
        #000 40%,
        #555 100%,
        #000 60%,
        #000 100%
      );
      background-size: 400% 100%;
      animation: loadingBar 5s linear infinite;
    }
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
      <style>{progressBarStyles}</style>
      <div
        className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
          isAnimating ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        style={{
          opacity: Math.max(0, 1 - currentTranslate / 400),
        }}
        onClick={handleCloseModal}
      />

      <div
        ref={modalRef}
        className={`relative bg-gray-100 w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-10 transition-transform duration-300 touch-none ${
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

        {/* Barra de progreso */}
        <div className="flex flex-row mx-4 gap-2 justify-center">
          {currentStep === 1 ? (
            <>
              <div className="w-1/6 h-2 rounded-full animated-loading"></div>
              <div className="w-1/6 border-gray-200 border h-2 rounded-full"></div>
            </>
          ) : (
            <>
              <div className="w-1/6 h-2 rounded-full bg-black"></div>
              <div className="w-1/6 h-2 rounded-full animated-loading"></div>
            </>
          )}
        </div>

        {/* Título según el paso actual */}
        <p className="text-2xl mx-4 mt-2 text-center">
          {currentStep === 1
            ? "Selecciona las metricas importantes"
            : "Empleados con visibilidad"}
        </p>

        {/* Botón Volver en el paso 2 */}
        {currentStep === 2 && (
          <div
            className="text-gray-400 mt-2 flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
            onClick={handlePrevious}
          >
            <img
              src={arrowIcon}
              className="transform rotate-180 h-2 opacity-30"
            />
            Volver
          </div>
        )}

        {/* Contenido del paso 1: Seleccionar KPIs */}
        {currentStep === 1 && (
          <div className="mt-4 flex-col space-y-2 w-full">
            {/* Buscador de KPIs */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-full appearance-none text-center focus:outline-none focus:ring-0"
                placeholder="Buscar por nombre..."
              />
            </div>

            {/* Lista de KPIs disponibles */}
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="flex flex-row gap-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  ref={kpiScrollContainerRef}
                  className="max-h-60 overflow-y-auto flex flex-col gap-1 mb-4"
                  onScroll={handleKpiScroll}
                >
                  {filteredKpis.length === 0 ? (
                    <p className="text-center text-gray-400  py-2">
                      No se encontraron KPIs disponibles
                    </p>
                  ) : (
                    filteredKpis.map((kpi) => (
                      <div
                        key={kpi.key}
                        className={`flex items-center flex justify-center items-center p-2 rounded-md cursor-pointer ${
                          selectedKpis.includes(kpi.key)
                            ? "bg-black text-gray-100"
                            : ""
                        }`}
                        onClick={() => toggleKpi(kpi.key)}
                      >
                        <span className="font-medium text-center">
                          {kpi.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Indicador de scroll */}
                {isScrollNeeded && !isNearBottom && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-gradient-to-t from-gray-100 to-transparent h-20 w-full flex items-end justify-center pb-1">
                      <div className="animate-bounce">
                        <img
                          src={arrowIcon}
                          className="h-2 transform rotate-90 opacity-30"
                          alt="Desplazar para ver más"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            )}

            {/* Botón Continuar */}
            <button
              onClick={handleContinue}
              disabled={isLoading || selectedKpis.length === 0}
              className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-3xl outline-none"
            >
              {isLoading ? (
                <div className="flex justify-center w-full items-center">
                  <div className="flex flex-row gap-1">
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              ) : (
                "Continuar"
              )}
            </button>
          </div>
        )}

        {/* Contenido del paso 2: Asignar empleados */}
        {currentStep === 2 && (
          <div className="mt-4 flex-col space-y-2 w-full">
            <div className="bg-gray-100  max-h-72 overflow-y-auto">
              {/* Empresario siempre seleccionado */}
              <ToggleEmpleado
                label="Dueño/Administrador (Tú)"
                isOn={true}
                onToggle={() => {}}
                disabled={true}
              />

              {/* Lista de empleados */}
              {allEmpleados.map((empleado) => (
                <ToggleEmpleado
                  key={empleado.id}
                  label={empleado.datos?.nombre || "Empleado"}
                  isOn={selectedEmpleados.includes(empleado.id)}
                  onToggle={() => handleToggleEmpleado(empleado.id)}
                />
              ))}
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            )}

            {/* Botón Agregar (finalizar) */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-lg outline-none"
            >
              {isLoading ? (
                <div className="flex justify-center w-full items-center">
                  <div className="flex flex-row gap-1">
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              ) : (
                "Agregar"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCreationModal;
