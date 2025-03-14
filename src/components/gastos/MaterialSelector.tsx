import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";

// Componente para mostrar y seleccionar materiales
export const MaterialSelector = ({
  selectedMaterial,
  onMaterialChange,
  formData,
  setFormData,
  onAddMaterial,
}) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMaterials, setFilteredMaterials] = useState([]);

  const auth = useSelector((state: RootState) => state.auth);
  const empresaId =
    auth?.tipoUsuario === "empresa"
      ? auth.usuario?.id
      : auth?.tipoUsuario === "empleado"
        ? auth.usuario?.empresaId
        : undefined;

  // Cargar materiales específicos para esta empresa
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);

        if (!empresaId) {
          console.error("No se pudo determinar el ID de la empresa");
          setLoading(false);
          return;
        }

        console.log(`Buscando materiales para la empresa: ${empresaId}`);

        const firestore = getFirestore();
        // Acceder a la colección de materiales dentro del documento de la empresa
        const materialesRef = collection(
          firestore,
          "absoluteClientes",
          empresaId,
          "materiales"
        );

        const materialesSnapshot = await getDocs(materialesRef);
        const materialesData = materialesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`Encontrados ${materialesData.length} materiales`);
        setMaterials(materialesData);
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoading(false);
      }
    };

    if (empresaId) {
      fetchMaterials();
    }
  }, [empresaId]);

  // Filtrar materiales basados en término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      // Si no hay término de búsqueda, mostramos todos los materiales
      setFilteredMaterials(materials);
    } else {
      // Filtrar por término de búsqueda
      const filtered = materials.filter(
        (material) =>
          material.nombre &&
          material.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMaterials(filtered);
    }
  }, [materials, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="section w-full relative mb-4 z-0">
      <p className="text-xl my-2 px-4">Materiales</p>

      {/* Buscador de materiales */}
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
            placeholder="Buscar material"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        // Mensaje cuando no hay materiales
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-lg mx-4">
          <p className="text-gray-500 mb-4 text-center">
            No hay materiales disponibles para esta empresa
          </p>
          {onAddMaterial && (
            <button
              onClick={onAddMaterial}
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
              Agregar material
            </button>
          )}
        </div>
      ) : (
        // Lista horizontal de materiales
        <div className="flex flex-row px-4 gap-2 overflow-x-auto">
          {/* Botón para agregar nuevo material */}
          {onAddMaterial && (
            <div
              onClick={onAddMaterial}
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
          )}

          {/* Lista de materiales */}
          {filteredMaterials.map((material) => (
            <div
              key={material.id || material.nombre}
              onClick={() => {
                if (setFormData) {
                  setFormData((prev) => ({
                    ...prev,
                    name: material.nombre,
                    unit: material.unit || "unidad",
                    category: material.categoria || prev.category,
                  }));
                }
                if (onMaterialChange) {
                  onMaterialChange(material);
                }
              }}
              className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
                formData?.name === material.nombre
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
                  d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.455l.33-1.652z"
                />
                <path
                  fillRule="evenodd"
                  d="M10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              {material.nombre &&
                material.nombre.charAt(0).toUpperCase() +
                  material.nombre.slice(1).toLowerCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialSelector;
