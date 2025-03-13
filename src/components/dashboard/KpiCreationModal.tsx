import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  updateKpiConfig,
  getKpiConfig,
  obtenerEmpleadosDeEmpresa,
} from "../../firebase/ClientesAbsolute";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";

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

const KpiCreationModal: React.FC<KpiCreationModalProps> = ({
  isOpen,
  onClose,
  empresaId,
}) => {
  const [selectedKpiKey, setSelectedKpiKey] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpleados, setSelectedEmpleados] = useState<string[]>([]);
  const [allEmpleados, setAllEmpleados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [existingKpis, setExistingKpis] = useState<string[]>([]);
  const [filteredKpis, setFilteredKpis] = useState(AVAILABLE_KPIS);

  // Obtener información del usuario para añadirlo automáticamente
  const auth = useSelector((state: RootState) => state.auth);
  const tipoUsuario = auth?.tipoUsuario;
  const usuarioId = tipoUsuario === "empresa" ? auth?.usuario?.id : "";

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

  useEffect(() => {
    // Cargar empleados de la empresa y KPIs existentes
    const loadData = async () => {
      if (!empresaId) return;

      setIsLoading(true);

      try {
        // Cargar empleados
        const empleados = await obtenerEmpleadosDeEmpresa(empresaId);
        setAllEmpleados(empleados);

        // Cargar configuración de KPIs existentes
        const kpiConfig = await getKpiConfig(empresaId);
        setExistingKpis(Object.keys(kpiConfig));

        // Filtrar la lista de KPIs disponibles
        const filtered = AVAILABLE_KPIS.filter(
          (kpi) => !Object.keys(kpiConfig).includes(kpi.key)
        );
        setFilteredKpis(filtered);
      } catch (error) {
        console.error("Error al cargar datos:", error);
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
    }
  }, [isOpen, empresaId, usuarioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKpiKey || !empresaId) {
      alert("Por favor selecciona un KPI");
      return;
    }

    setIsLoading(true);

    try {
      // Obtener configuración actual de KPIs
      const currentConfig = await getKpiConfig(empresaId);

      // Añadir nuevo KPI a la configuración
      const updatedConfig = {
        ...currentConfig,
        [selectedKpiKey]: selectedEmpleados,
      };

      // Guardar configuración actualizada
      await updateKpiConfig(empresaId, updatedConfig);

      // Mostrar mensaje de éxito y cerrar modal
      alert("KPI añadido exitosamente. Refresca la página para verlo.");
      onClose();
    } catch (error) {
      console.error("Error al añadir KPI:", error);
      alert("Error al añadir KPI. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        <h2 className="text-2xl font-coolvetica font-semibold mb-4">
          Agregar KPI al dashboard
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Buscador de KPIs */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Buscar KPI</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Buscar por nombre..."
            />
          </div>

          {/* Lista de KPIs disponibles */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              KPIs disponibles
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded p-2">
              {isLoading ? (
                <p className="text-center text-gray-500 py-2">Cargando...</p>
              ) : filteredKpis.length === 0 ? (
                <p className="text-center text-gray-500 py-2">
                  No se encontraron KPIs disponibles
                </p>
              ) : (
                filteredKpis.map((kpi) => (
                  <div
                    key={kpi.key}
                    className={`flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer ${
                      selectedKpiKey === kpi.key ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setSelectedKpiKey(kpi.key)}
                  >
                    <input
                      type="radio"
                      name="kpi"
                      checked={selectedKpiKey === kpi.key}
                      onChange={() => setSelectedKpiKey(kpi.key)}
                      className="mr-2"
                    />
                    <span className="font-medium">{kpi.title}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({kpi.key})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Empleados con acceso */}
          {selectedKpiKey && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Empleados con acceso
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                {/* Empresario siempre seleccionado */}
                <div className="flex items-center p-1 bg-gray-100 rounded mb-1">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mr-2"
                  />
                  <span className="text-sm">Dueño/Administrador (Tú)</span>
                </div>

                {/* Lista de empleados */}
                {allEmpleados.map((empleado) => (
                  <div
                    key={empleado.id}
                    className="flex items-center p-1 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmpleados.includes(empleado.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmpleados([
                            ...selectedEmpleados,
                            empleado.id,
                          ]);
                        } else {
                          setSelectedEmpleados(
                            selectedEmpleados.filter((id) => id !== empleado.id)
                          );
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {empleado.datos?.nombre || "Empleado"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              disabled={isLoading || !selectedKpiKey}
            >
              {isLoading ? "Agregando..." : "Agregar KPI"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default KpiCreationModal;
