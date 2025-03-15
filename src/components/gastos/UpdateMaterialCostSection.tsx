// Este componente se añadiría al FormGasto.tsx
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  calcularCostoMaterialDerivado,
  actualizarCostoMaterial,
} from "../../helpers/unitConverter";
import Swal from "sweetalert2";

// Componente para la sección de actualización de costos
export const UpdateMaterialCostSection = ({ formData, showThisStep }) => {
  const auth = useSelector((state: RootState) => state.auth);
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatesMaterialCost, setUpdatesMaterialCost] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para la empresa
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

  // Cargar lista de materiales
  useEffect(() => {
    const fetchMateriales = async () => {
      if (!empresaId) return;

      try {
        setLoading(true);
        const firestore = getFirestore();
        let materialesRef;

        if (isAnhelo) {
          materialesRef = collection(firestore, "materiales");
        } else {
          materialesRef = collection(
            firestore,
            "absoluteClientes",
            empresaId,
            "materiales"
          );
        }

        const materialesSnapshot = await getDocs(materialesRef);
        const materialesList = materialesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filtrar materiales que tienen la propiedad medida y unidadMedida
        const materialesConMedidas = materialesList.filter(
          (mat) => mat.medida !== undefined && mat.unidadMedida !== undefined
        );

        setMateriales(materialesConMedidas);
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoading(false);
      }
    };

    if (showThisStep) {
      fetchMateriales();
    }
  }, [empresaId, isAnhelo, showThisStep]);

  // Filtrar materiales por término de búsqueda
  const filteredMateriales = materiales.filter((material) =>
    material.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mostrar información de conversión
  const showConversionInfo = () => {
    if (!selectedMaterial || !formData.total || !formData.quantity) return null;

    const material = materiales.find((m) => m.id === selectedMaterial);
    if (!material) return null;

    try {
      const resultado = calcularCostoMaterialDerivado(
        formData.total,
        formData.quantity,
        formData.unit,
        material.medida,
        material.unidadMedida
      );

      return (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
          <p className="text-sm font-medium">Resultado del cálculo:</p>
          <ul className="mt-1 space-y-1 text-xs">
            <li>
              <span className="font-medium">Material:</span> {material.nombre}
              <span>
                {" "}
                ({material.medida} {material.unidadMedida} por unidad)
              </span>
            </li>
            <li>
              <span className="font-medium">Compra:</span> {formData.quantity}{" "}
              {formData.unit}
              <span> por ${formData.total}</span>
            </li>
            <li>
              <span className="font-medium">Conversión:</span>{" "}
              {formData.quantity} {formData.unit} =
              <span>
                {" "}
                {resultado.cantidadTotalConvertida.toFixed(2)}{" "}
                {material.unidadMedida}
              </span>
            </li>
            <li>
              <span className="font-medium">Unidades producibles:</span>{" "}
              {resultado.unidadesMaterialDerivado} unidades
            </li>
            <li className="font-bold">
              <span>Nuevo costo:</span> ${resultado.costoPorUnidad} por unidad
            </li>
          </ul>
        </div>
      );
    } catch (error) {
      return (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600">
            Error en la conversión: {error.message}
          </p>
        </div>
      );
    }
  };

  if (!showThisStep) return null;

  return (
    <div className="mt-4 px-4">
      <p className="text-xl my-2">Actualización de costos</p>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="updatesCost"
          name="updatesCost"
          className="mr-2 h-4 w-4"
          checked={updatesMaterialCost}
          onChange={(e) => setUpdatesMaterialCost(e.target.checked)}
        />
        <label htmlFor="updatesCost" className="text-xs">
          Esta compra actualiza el costo de algún material
        </label>
      </div>

      {updatesMaterialCost && (
        <>
          {/* Buscador de materiales */}
          <div className="mb-3">
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

          {loading ? (
            <div className="flex justify-center my-4">
              <div className="w-6 h-6 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
            </div>
          ) : filteredMateriales.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              No se encontraron materiales con medidas establecidas
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {filteredMateriales.map((material) => (
                <div
                  key={material.id}
                  onClick={() => setSelectedMaterial(material.id)}
                  className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
                    selectedMaterial === material.id
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
                    <path d="M17 2.75a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zM17 15.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM3.75 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM4.5 2.75a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zM10 11a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5A.75.75 0 0110 11zM10.75 2.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM10 6a2 2 0 100 4 2 2 0 000-4zM3.75 10a2 2 0 100 4 2 2 0 000-4zM16.25 10a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {material.nombre}
                  <span className="ml-1 text-xs opacity-70">
                    ({material.medida} {material.unidadMedida})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Mostrar información de la conversión */}
          {showConversionInfo()}
        </>
      )}
    </div>
  );
};

// Esta función sería llamada desde handleSubmit en FormGasto
export const procesarActualizacionCostos = async (
  formData,
  updatesMaterialCost,
  selectedMaterial,
  materiales,
  empresaId,
  isAnhelo
) => {
  if (!updatesMaterialCost || !selectedMaterial) return;

  try {
    const material = materiales.find((m) => m.id === selectedMaterial);
    if (!material) throw new Error("Material no encontrado");

    const resultado = calcularCostoMaterialDerivado(
      formData.total,
      formData.quantity,
      formData.unit,
      material.medida,
      material.unidadMedida
    );

    const firestore = getFirestore();
    await actualizarCostoMaterial(
      firestore,
      empresaId,
      material.id,
      resultado.costoPorUnidad,
      isAnhelo
    );

    await Swal.fire({
      icon: "success",
      title: "Costo actualizado",
      text: `El costo de ${material.nombre} se ha actualizado a $${resultado.costoPorUnidad} por unidad`,
      timer: 3000,
    });

    return true;
  } catch (error) {
    console.error("Error al actualizar costo:", error);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el costo: ${error.message}`,
    });
    return false;
  }
};
