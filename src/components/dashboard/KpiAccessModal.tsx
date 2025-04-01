import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import Datepicker from "react-tailwindcss-datepicker";
import {
  obtenerEmpleadosDeEmpresa,
  updateKpiConfig,
  EmpresaProps,
  EmpleadoProps,
  getKpiConfig,
  ModifierType,
  DateRange,
} from "../../firebase/ClientesAbsolute";

// Componente Toggle reutilizable para permisos
const TogglePermiso = ({ isOn, onToggle, label, disabled = false }) => (
  <div className="flex items-center justify-between w-full">
    <p className="text-xs">{label}</p>
    <div
      className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? (disabled ? "bg-gray-400" : "bg-black") : "bg-gray-200"
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

// Componente para ajustar el modificador numérico simple de un KPI
const ModifierInput = ({
  userId,
  userName,
  value,
  onChange,
  disabled = false,
}) => (
  <div className="flex items-center justify-between w-full mt-2 mb-2 px-2 py-1 bg-gray-50 rounded">
    <div className="flex items-center">
      <p className="text-xs font-medium">{userName}</p>
      <span className="text-xs text-gray-500 ml-2">× </span>
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(userId, parseFloat(e.target.value) || 1)}
      min="0.1"
      max="10"
      step="0.1"
      disabled={disabled}
      className={`w-16 text-right border rounded p-1 text-xs ${disabled ? "bg-gray-100" : "bg-white"}`}
    />
  </div>
);

// Componente para gestionar un rango de fechas con modificador
const DateRangeModifier = ({
  index,
  range,
  onUpdate,
  onDelete,
  disabled = false,
}) => {
  const [rangeValue, setRangeValue] = useState({
    startDate: range.startDate,
    endDate: range.endDate || null,
  });

  const handleDateChange = (value) => {
    setRangeValue(value);
    onUpdate(index, {
      ...range,
      startDate: value.startDate,
      endDate: value.endDate,
    });
  };

  const handleValueChange = (e) => {
    const newValue = parseFloat(e.target.value) || 1;
    onUpdate(index, {
      ...range,
      value: newValue,
    });
  };

  return (
    <div className="flex flex-col w-full mt-2 mb-2 px-2 py-2 bg-gray-50 rounded">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Rango {index + 1}</span>
        {!disabled && (
          <button
            onClick={() => onDelete(index)}
            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded"
          >
            Eliminar
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <Datepicker
          useRange={true}
          asSingle={false}
          separator="hasta"
          value={rangeValue}
          onChange={handleDateChange}
          disabled={disabled}
          inputClassName="w-full text-xs p-1 border rounded"
          displayFormat="DD/MM/YYYY"
          placeholder="Seleccione rango de fechas"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Multiplicador:</span>
        <input
          type="number"
          value={range.value}
          onChange={handleValueChange}
          min="0.1"
          max="10"
          step="0.1"
          disabled={disabled}
          className={`w-16 text-right border rounded p-1 text-xs ${disabled ? "bg-gray-100" : "bg-white"}`}
        />
      </div>
    </div>
  );
};

// Componente para gestionar modificadores por rangos de fechas
const DateRangeModifiers = ({
  userId,
  userName,
  modifier,
  onChange,
  disabled = false,
}) => {
  // Convertir al formato de rangos de fechas si es un valor simple
  const [modifierConfig, setModifierConfig] = useState(() => {
    if (typeof modifier === "number") {
      return {
        type: "date_range",
        default: modifier,
        ranges: [],
      };
    } else if (typeof modifier === "object" && modifier !== null) {
      return modifier;
    } else {
      return {
        type: "date_range",
        default: 1,
        ranges: [],
      };
    }
  });

  // Actualizar el valor por defecto
  const handleDefaultChange = (e) => {
    const newDefault = parseFloat(e.target.value) || 1;
    const updatedConfig = {
      ...modifierConfig,
      default: newDefault,
    };
    setModifierConfig(updatedConfig);
    onChange(userId, updatedConfig);
  };

  // Añadir un nuevo rango
  const handleAddRange = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const newRange = {
      startDate: today.toISOString().split("T")[0],
      endDate: tomorrow.toISOString().split("T")[0],
      value: 1,
    };

    const updatedRanges = [...modifierConfig.ranges, newRange];
    const updatedConfig = {
      ...modifierConfig,
      ranges: updatedRanges,
    };

    setModifierConfig(updatedConfig);
    onChange(userId, updatedConfig);
  };

  // Actualizar un rango existente
  const handleUpdateRange = (index, updatedRange) => {
    const updatedRanges = [...modifierConfig.ranges];
    updatedRanges[index] = updatedRange;

    const updatedConfig = {
      ...modifierConfig,
      ranges: updatedRanges,
    };

    setModifierConfig(updatedConfig);
    onChange(userId, updatedConfig);
  };

  // Eliminar un rango
  const handleDeleteRange = (index) => {
    const updatedRanges = modifierConfig.ranges.filter((_, i) => i !== index);

    const updatedConfig = {
      ...modifierConfig,
      ranges: updatedRanges,
    };

    setModifierConfig(updatedConfig);
    onChange(userId, updatedConfig);
  };

  return (
    <div className="flex flex-col w-full mt-2 mb-4 border-t pt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium">{userName}</p>
      </div>

      <div className="flex items-center justify-between mb-3 px-2 py-1 bg-gray-50 rounded">
        <span className="text-xs">Valor por defecto:</span>
        <input
          type="number"
          value={modifierConfig.default}
          onChange={handleDefaultChange}
          min="0.1"
          max="10"
          step="0.1"
          disabled={disabled}
          className={`w-16 text-right border rounded p-1 text-xs ${disabled ? "bg-gray-100" : "bg-white"}`}
        />
      </div>

      {/* Lista de rangos de fechas */}
      {modifierConfig.ranges.map((range, index) => (
        <DateRangeModifier
          key={index}
          index={index}
          range={range}
          onUpdate={handleUpdateRange}
          onDelete={handleDeleteRange}
          disabled={disabled}
        />
      ))}

      {/* Botón para añadir nuevo rango */}
      {!disabled && (
        <button
          onClick={handleAddRange}
          className="mt-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 px-3 rounded-lg"
        >
          + Añadir rango de fechas
        </button>
      )}
    </div>
  );
};

interface KpiAccessModalProps {
  kpiKey: string;
  kpiTitle: string;
  isOpen: boolean;
  onClose: () => void;
  currentAccessIds: string[];
  onUpdate: (
    newAccessIds: string[],
    modifiers?: { [userId: string]: ModifierType }
  ) => void;
  currentModifiers?: { [userId: string]: ModifierType };
}

export const KpiAccessModal: React.FC<KpiAccessModalProps> = ({
  kpiKey,
  kpiTitle,
  isOpen,
  onClose,
  currentAccessIds,
  onUpdate,
  currentModifiers = {},
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  const [empleados, setEmpleados] = useState<EmpleadoProps[]>([]);
  const [accessToggles, setAccessToggles] = useState<{
    [key: string]: boolean;
  }>({});
  const [modifiers, setModifiers] = useState<{
    [key: string]: ModifierType;
  }>(currentModifiers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModifiers, setShowModifiers] = useState(false);
  const [showDateRanges, setShowDateRanges] = useState(false);

  // Obtener datos de la empresa del estado de redux
  const auth = useSelector((state: RootState) => state.auth);
  const empresa = auth.usuario;
  const tipoUsuario = auth.tipoUsuario;
  const empresaId = tipoUsuario === "empresa" ? empresa?.id : "";
  const usuarioId = empresa?.id || "";

  // Verificar si es ANHELO basado en el ID de la empresa
  const isAnhelo = empresaId === "8497d9a8-b474-41d8-86a9-43a9454927c1";

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
      setModifiers(currentModifiers);
    }
  }, [isOpen, currentModifiers]);

  // Cargar empleados activos
  const fetchEmpleados = async () => {
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
    }
  };

  // Cargar configuración actual de KPIs directamente de Firestore
  const fetchCurrentAccess = async (empleadosData: EmpleadoProps[]) => {
    try {
      const config = await getKpiConfig(empresaId);

      // Obtener los IDs actuales directamente de Firestore
      const kpiConfig = config[kpiKey] || {};
      const updatedAccessIds = kpiConfig.accessIds || [];
      const updatedModifiers = kpiConfig.modifiers || {};

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
      setModifiers(updatedModifiers);
    } catch (error) {
      console.error("Error al obtener configuración actual:", error);
    }
  };

  // Actualizar el modificador para un usuario específico
  const handleModifierChange = (userId, value) => {
    setModifiers((prev) => ({
      ...prev,
      [userId]: value,
    }));
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
    setModifiers({});
    onClose();
  };

  // Guardar cambios en Firestore
  const handleSaveAccess = async () => {
    // Solo activar loading para el botón, no para la sección de empleados
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

      // Filtrar los modificadores para incluir solo los usuarios con acceso
      const activeModifiers = {};
      Object.entries(modifiers).forEach(([id, value]) => {
        if (newAccessIds.includes(id)) {
          activeModifiers[id] = value;
        }
      });

      // Obtener configuración actual
      const currentConfig = await getKpiConfig(empresaId);

      // Crear configuración actualizada
      const updatedConfig = {
        ...currentConfig,
        [kpiKey]: {
          accessIds: newAccessIds,
          modifiers: activeModifiers,
        },
      };

      // Guardar en Firestore
      await updateKpiConfig(empresaId, updatedConfig);

      // Actualizar en el componente padre
      onUpdate(newAccessIds, activeModifiers);

      // Cerrar el modal
      handleClose();
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      setError("Ocurrió un error al guardar los permisos de acceso.");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar el KPI
  const handleDeleteKpi = async () => {
    if (
      window.confirm(`¿Estás seguro que quieres eliminar el KPI "${kpiTitle}"?`)
    ) {
      setLoading(true);
      try {
        // Obtener configuración actual
        const currentConfig = await getKpiConfig(empresaId);

        // Crear nueva configuración sin este KPI
        const { [kpiKey]: removedKpi, ...updatedConfig } = currentConfig;

        // Guardar en Firestore
        await updateKpiConfig(empresaId, updatedConfig);

        // Cerrar el modal
        handleClose();

        // Recargar la página para reflejar los cambios
        window.location.reload();
      } catch (error) {
        console.error("Error al eliminar KPI:", error);
        setError("Ocurrió un error al eliminar el KPI.");
      } finally {
        setLoading(false);
      }
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
          <div className="mb-8">
            <h2 className="text-2xl mx-8 text-center font-bold mb-4">
              Visibilidad de {kpiTitle.toLocaleLowerCase()}
            </h2>

            {/* Toggle para mostrar/ocultar modificadores - Solo visible si isAnhelo es true y el usuario es empresario */}
            {isAnhelo && tipoUsuario === "empresa" && (
              <div className="flex flex-row gap-2">
                <div
                  onClick={() => {
                    setShowModifiers(!showModifiers);
                    if (showDateRanges && !showModifiers) {
                      setShowDateRanges(false);
                    }
                  }}
                  className={`flex items-center w-fit flex-row px-4 justify-center gap-2 p-2 rounded-full ${
                    showModifiers
                      ? "bg-black text-gray-100"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {showModifiers ? (
                    /* Eye icon when modifiers are shown */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6"
                    >
                      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                      <path
                        fillRule="evenodd"
                        d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    /* Eye-slash icon when modifiers are hidden */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6"
                    >
                      <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113Z" />
                      <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0 1 15.75 12ZM12.53 15.713l-4.243-4.244a3.75 3.75 0 0 0 4.244 4.243Z" />
                      <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 0 0-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 0 1 6.75 12Z" />
                    </svg>
                  )}

                  <span className="text-sm font-medium">Alteraciones</span>
                </div>

                {/* Toggle para modificadores por rango de fechas */}
                {showModifiers && (
                  <div
                    onClick={() => setShowDateRanges(!showDateRanges)}
                    className={`flex items-center w-fit flex-row px-4 justify-center gap-2 p-2 rounded-full ${
                      showDateRanges
                        ? "bg-black text-gray-100"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {showDateRanges ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6"
                      >
                        <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                        <path
                          fillRule="evenodd"
                          d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}

                    <span className="text-sm font-medium">
                      Rangos de fechas
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje explicativo de modificadores */}
            {isAnhelo && tipoUsuario === "empresa" && showModifiers && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-4 text-xs">
                <p className="text-blue-700">
                  Los modificadores permiten personalizar los valores mostrados
                  a cada usuario. Un modificador de 1 muestra el valor real. Un
                  modificador de 2 duplicará el valor. Un modificador de 0.5
                  mostrará la mitad del valor real.
                </p>
                {showDateRanges && (
                  <p className="text-blue-700 mt-2">
                    Con rangos de fechas puedes aplicar diferentes modificadores
                    según el periodo seleccionado, facilitando ajustes
                    estacionales o durante promociones específicas.
                  </p>
                )}
                <p className="text-blue-700 mt-2 font-bold">
                  Nota: Los valores modificados son solo visuales y no afectan
                  los datos reales.
                </p>
              </div>
            )}
          </div>

          {/* Sección para el dueño/empresario */}
          <div>
            <TogglePermiso
              label={
                (empresa as EmpresaProps)?.datosUsuario?.nombreUsuario ||
                "Dueño"
              }
              isOn={true} // Siempre activado para el empresario
              onToggle={() => {}} // No permite cambios
              disabled={true} // Deshabilitado para no poder interactuar
            />

            {/* Sistema de modificadores para el dueño */}
            {isAnhelo && tipoUsuario === "empresa" && showModifiers && (
              <>
                {showDateRanges ? (
                  // Mostrar modificadores por rango de fechas para el dueño
                  <DateRangeModifiers
                    userId={usuarioId}
                    userName="Valor personalizado"
                    modifier={modifiers[usuarioId] || 1}
                    onChange={handleModifierChange}
                  />
                ) : (
                  // Mostrar modificador simple para el dueño
                  <ModifierInput
                    userId={usuarioId}
                    userName="Valor personalizado"
                    value={
                      typeof modifiers[usuarioId] === "number"
                        ? modifiers[usuarioId]
                        : modifiers[usuarioId]?.default || 1
                    }
                    onChange={(id, value) => handleModifierChange(id, value)}
                  />
                )}
              </>
            )}
          </div>

          {/* Sección de empleados */}
          {empleados.length > 0 ? (
            <div className="rounded-lg gap-2 flex flex-col max-h-60 overflow-y-auto">
              {empleados.map((empleado) => (
                <div key={empleado.id}>
                  <TogglePermiso
                    label={empleado.datos?.nombre || "Sin nombre"}
                    isOn={accessToggles[empleado.id] || false}
                    onToggle={() => handleToggleAccess(empleado.id)}
                  />

                  {/* Sistema de modificadores para empleados */}
                  {isAnhelo &&
                    tipoUsuario === "empresa" &&
                    showModifiers &&
                    accessToggles[empleado.id] && (
                      <>
                        {showDateRanges ? (
                          // Mostrar modificadores por rango de fechas para empleados
                          <DateRangeModifiers
                            userId={empleado.id}
                            userName="Valor personalizado"
                            modifier={modifiers[empleado.id] || 1}
                            onChange={handleModifierChange}
                          />
                        ) : (
                          // Mostrar modificador simple para empleados
                          <ModifierInput
                            userId={empleado.id}
                            userName="Valor personalizado"
                            value={
                              typeof modifiers[empleado.id] === "number"
                                ? modifiers[empleado.id]
                                : modifiers[empleado.id]?.default || 1
                            }
                            onChange={(id, value) =>
                              handleModifierChange(id, value)
                            }
                            disabled={!accessToggles[empleado.id]}
                          />
                        )}
                      </>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg text-center text-gray-400 text-xs">
              No hay empleados activos
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
              <p className="text-red-500 text-xs">{error}</p>
            </div>
          )}
        </div>

        {/* actualizar */}
        <button
          onClick={handleSaveAccess}
          disabled={loading}
          className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-3xl outline-none"
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

        {/* eliminar */}
        <button
          onClick={handleDeleteKpi}
          disabled={loading}
          className="text-red-main w-full mt-2 text-4xl h-20 px-4 bg-gray-200 font-bold rounded-3xl outline-none"
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
            "Eliminar"
          )}
        </button>
      </div>
    </div>
  );
};

export default KpiAccessModal;
