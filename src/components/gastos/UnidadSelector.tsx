import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { UNIDADES_BASICAS } from "../../constants/expenses";
import arrow from "../../assets/arrowIcon.png"; // Asegúrate de importar el mismo icono

// Componente para mostrar y gestionar las unidades
export const UnidadSelector = ({
  selectedUnit,
  onUnitChange,
  formData,
  setFormData,
  onAddUnit, // Prop para manejar "Agregar unidad"
}) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Para búsqueda
  const [filteredUnits, setFilteredUnits] = useState([]); // Para búsqueda

  const auth = useSelector((state: RootState) => state.auth);
  const empresaId =
    auth?.tipoUsuario === "empresa"
      ? auth.usuario?.id
      : auth?.tipoUsuario === "empleado"
        ? auth.usuario?.empresaId
        : undefined;

  const empresaNombre =
    auth?.tipoUsuario === "empresa" && auth.usuario?.datosGenerales
      ? auth.usuario.datosGenerales.nombre || ""
      : "";

  const isAnhelo = empresaNombre === "ANHELO";

  // Cargar unidades desde Firestore
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const firestore = getFirestore();
        const docRef = doc(firestore, "absoluteClientes", empresaId);

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Intentamos obtener las unidades personalizadas de config
          const data = docSnap.data();
          let customUnits = [];

          if (data.config && data.config.gastosUnidades) {
            customUnits = data.config.gastosUnidades;
          }

          // Combinamos las unidades básicas con las personalizadas
          const allUnits = [...UNIDADES_BASICAS, ...customUnits];

          // Eliminamos duplicados (por si acaso hay unidades que existan en ambos arrays)
          const uniqueUnits = [...new Set(allUnits)];

          // console.log("[DEBUG] Unidades cargadas:", uniqueUnits);
          setUnits(uniqueUnits);

          // Si la unidad seleccionada no está en la lista, seleccionamos la primera
          if (uniqueUnits.length > 0 && !uniqueUnits.includes(formData.unit)) {
            const firstUnit = uniqueUnits[0];
            setFormData((prev) => ({
              ...prev,
              unit: firstUnit,
            }));
          }
        }
      } catch (error) {
        console.error("Error al cargar unidades:", error);
        // En caso de error, al menos establecemos las unidades básicas
        setUnits([...UNIDADES_BASICAS]);
      } finally {
        setLoading(false);
      }
    };

    if (empresaId) {
      fetchUnits();
    } else {
      // Si no hay empresaId, al menos ponemos las unidades básicas
      setUnits([...UNIDADES_BASICAS]);
      setLoading(false);
    }
  }, [empresaId, isAnhelo, formData.unit, setFormData]);

  // Filtrar unidades basadas en término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      // Si no hay término de búsqueda, mostramos todas las unidades
      setFilteredUnits(units);
    } else {
      // Filtrar por término de búsqueda
      const filtered = units.filter((unit) =>
        unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUnits(filtered);
    }
  }, [units, searchTerm]);

  // Manejar selección de unidad
  const handleUnitSelect = (unit) => {
    // Actualizar formData
    setFormData((prev) => ({
      ...prev,
      unit: unit,
    }));

    // Notificar al componente padre
    if (onUnitChange) {
      onUnitChange(unit);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="section w-full relative mb-4 z-0">
      <p className="text-xl my-2 px-4">Unidad</p>

      {units.length === 0 ? (
        // Mensaje cuando no hay unidades (esto no debería ocurrir normalmente)
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4 text-center">
            No hay unidades definidas
          </p>
          <button
            onClick={onAddUnit}
            className="bg-black text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 mr-2"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Crear primera unidad
          </button>
        </div>
      ) : (
        <div>
          {/* Buscador de unidades */}
          <div className="px-4 mb-3">
            <div className="flex items-center w-full h-10 gap-1 rounded-lg border border-gray-300 focus:ring-0 font-coolvetica text-black text-xs font-light">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 ml-1.5 mb-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar unidad"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Lista de unidades existentes */}
          <div className="flex flex-row px-4 gap-2 overflow-x-auto">
            {/* Botón para agregar nueva unidad */}
            <div
              onClick={onAddUnit}
              className="cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center bg-gray-100 text-black border border-dashed border-gray-400 whitespace-nowrap flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              Agregar
            </div>

            {filteredUnits.map((unit, index) => {
              const isSelected = formData.unit === unit;

              return (
                <div
                  key={index}
                  onClick={() => handleUnitSelect(unit)}
                  className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
                    isSelected
                      ? "bg-black text-gray-100"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 mr-2"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.94 5.5c.944-.945 2.56-.276 2.56 1.06V8h5.75a.75.75 0 010 1.5H8.5v4.275c0 .296.144.455.26.499a3.5 3.5 0 004.402-1.77h-.412a.75.75 0 010-1.5h1.5A.75.75 0 0115 12v1.75a.75.75 0 01-.75.75h-.01a7.03 7.03 0 01-6.9 2.245c-.66-.185-1.16-.892-1.161-1.813V9.5H4.75a.75.75 0 010-1.5h1.45V6.56c0-.546-.294-.77-.54-.77A.75.75 0 015 5.25v-.657c0-.152.086-.33.3-.436A.75.75 0 015.94 5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnidadSelector;
