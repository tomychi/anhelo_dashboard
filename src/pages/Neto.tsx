import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import {
  ReadGastosSinceTwoMonthsAgo,
  ReadMaterials,
} from "../firebase/ReadData";
import { Gasto } from "../types/types";
import PeriodicidadModal from "../components/gastos/PeriodicidadModal";
import {
  getGastosCategoriesConfig,
  updateCategoriaPeriodicidad,
  CategoriaGastoConfig,
} from "../firebase/ClientesAbsolute";

// SVG de configuración (engranaje)
const CogIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06 .06a2 2 0 0 1 0 2.83a2 2 0 0 1 -2.83 0l-.06 -.06a1.65 1.65 0 0 0 -1.82 -.33a1.65 1.65 0 0 0 -1 1.51v.17a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2v-.17a1.65 1.65 0 0 0 -1 -1.51a1.65 1.65 0 0 0 -1.82 .33l-.06 .06a2 2 0 0 1 -2.83 0a2 2 0 0 1 0 -2.83l.06 -.06a1.65 1.65 0 0 0 .33 -1.82a1.65 1.65 0 0 0 -1.51 -1H3a2 2 0 0 1 -2 -2a2 2 0 0 1 2 -2h.17a1.65 1.65 0 0 0 1.51 -1a1.65 1.65 0 0 0 -.33 -1.82l-.06 -.06a2 2 0 0 1 0 -2.83a2 2 0 0 1 2.83 0l.06 .06a1.65 1.65 0 0 0 1.82 .33H9a1.65 1.65 0 0 0 1 -1.51V3a2 2 0 0 1 2 -2a2 2 0 0 1 2 2v.17a1.65 1.65 0 0 0 1 1.51a1.65 1.65 0 0 0 1.82 -.33l.06 -.06a2 2 0 0 1 2.83 0a2 2 0 0 1 0 2.83l-.06 .06a1.65 1.65 0 0 0 -.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-.17a1.65 1.65 0 0 0 -1.51 1z"></path>
  </svg>
);

export const Neto = () => {
  // Obtener datos del Redux store
  const { facturacionTotal, neto, expenseData, valueDate } = useSelector(
    (state: RootState) => state.data
  );
  const auth = useSelector((state: RootState) => state.auth);
  const empresaId = auth.usuario?.id;

  // Estado para los gastos
  const [gastosPorCategoria, setGastosPorCategoria] = useState<{
    [key: string]: number;
  }>({});
  const [totalGastos, setTotalGastos] = useState<number>(0);
  const [excedenteValue, setExcedenteValue] = useState<number>(0);

  // Estado para el modal de configuración de periodicidad
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [periodicidades, setPeriodicidades] = useState<{
    [key: string]: number;
  }>({});
  const [loading, setLoading] = useState(false);

  // Calcular la materia prima (bruto - neto)
  const materiaPrima = facturacionTotal - neto;

  // Función para formatear números como moneda
  const formatoMoneda = (valor: number) => {
    return `$ ${valor.toFixed(0)}`;
  };

  // Función para calcular el porcentaje respecto a la facturación total
  const calcularPorcentaje = (valor: number) => {
    if (facturacionTotal === 0) return "0%";
    return `${((valor / facturacionTotal) * 100).toFixed(1)}%`;
  };

  // Cargar configuraciones de periodicidad desde Firebase
  useEffect(() => {
    const cargarPeriodicidades = async () => {
      if (!empresaId) return;

      setLoading(true);
      try {
        const categoriasConfig = await getGastosCategoriesConfig(empresaId);

        // Convertir a objeto de periodicidades para uso más fácil
        const periodicidadesObj = {};
        categoriasConfig.forEach((cat) => {
          periodicidadesObj[cat.nombre] = cat.periodicidad;
        });

        setPeriodicidades(periodicidadesObj);
        // console.log("Periodicidades cargadas:", periodicidadesObj);
      } catch (error) {
        console.error("Error al cargar periodicidades:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPeriodicidades();
  }, [empresaId]);

  // Calcular cuántos días hay en el período seleccionado
  const calcularDiasSeleccionados = (): number => {
    if (!valueDate || !valueDate.startDate || !valueDate.endDate) {
      return 1; // Por defecto, un día
    }
    const startDate = new Date(valueDate.startDate);
    const endDate = new Date(valueDate.endDate);
    const diferenciaTiempo = endDate.getTime() - startDate.getTime();
    return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
  };

  // Procesar los gastos por categoría
  useEffect(() => {
    const procesarGastos = () => {
      // Inicializar objeto para almacenar sumas por categoría
      const categorias: { [key: string]: number } = {};
      let sumaTotal = 0;

      // Mostrar datos iniciales
      // console.log("====== DATOS INICIALES ======");
      // console.log("Facturación Total (Bruto):", facturacionTotal);
      // console.log("Neto:", neto);
      // console.log("Materia Prima (calculada):", materiaPrima);
      // console.log("Días seleccionados:", calcularDiasSeleccionados());
      // console.log("Periodicidades configuradas:", periodicidades);

      // console.log("====== GASTOS POR PROCESAR ======");
      // console.log(expenseData);

      // Agrupar gastos por categoría para calcular sumas
      const gastosPorCategoria = {};

      // Primero, agrupamos todos los gastos por categoría
      expenseData.forEach((gasto: Gasto) => {
        if (!gastosPorCategoria[gasto.category]) {
          gastosPorCategoria[gasto.category] = [];
        }
        gastosPorCategoria[gasto.category].push(gasto);
      });

      // Calcular la suma para cada categoría teniendo en cuenta la periodicidad
      Object.entries(gastosPorCategoria).forEach(([categoria, gastos]) => {
        // console.log(`\n--- CATEGORÍA: ${categoria.toUpperCase()} ---`);
        let sumaCategoria = 0;

        // @ts-ignore - Sabemos que gastos es un array
        gastos.forEach((gasto) => {
          // Obtener la periodicidad configurada para esta categoría
          const periodicidad = periodicidades[categoria] || 1;

          // Ajustar el valor según la periodicidad y días seleccionados
          const valorAjustado =
            periodicidad === 1
              ? gasto.total
              : (gasto.total / periodicidad) * calcularDiasSeleccionados();

          // console.log(
          //   `${gasto.name}: Valor original $ ${gasto.total.toFixed(0)}, Ajustado $ ${valorAjustado.toFixed(0)}`
          // );
          sumaCategoria += valorAjustado;
        });

        // console.log(
        //   `TOTAL ${categoria.toUpperCase()}: $ ${sumaCategoria.toFixed(0)}`
        // );

        // Guardar la suma en el objeto de categorías
        categorias[categoria] = sumaCategoria;
        sumaTotal += sumaCategoria;
      });

      // Añadir la materia prima (si no existe como categoría)
      if (!categorias["materia prima"]) {
        categorias["materia prima"] = materiaPrima;
        sumaTotal += materiaPrima;
        // console.log(
        //   `\nAñadiendo materia prima calculada: $ ${materiaPrima.toFixed(0)}`
        // );
      } else {
        // console.log(
        //   `\nMateria prima ya existe en categorías, valor total: $ ${categorias["materia prima"].toFixed(0)}`
        // );
      }

      // Calcular el excedente (facturación total - gastos totales)
      const excedente = facturacionTotal - sumaTotal;

      // console.log("\n====== RESUMEN DE GASTOS AGRUPADOS ======");
      // console.log("Categorías con sus totales:");
      Object.entries(categorias).forEach(([categoria, total]) => {
        // console.log(
        //   `${categoria}: $ ${total.toFixed(0)} (${calcularPorcentaje(total)})`
        // );
      });
      // console.log(`\nTotal de Gastos: $ ${sumaTotal.toFixed(0)}`);
      // console.log(
      //   `Excedente calculado: $ ${excedente.toFixed(0)} (${calcularPorcentaje(excedente)})`
      // );

      // Actualizar estados
      setGastosPorCategoria(categorias);
      setTotalGastos(sumaTotal);
      setExcedenteValue(excedente);
    };

    procesarGastos();
  }, [
    expenseData,
    facturacionTotal,
    materiaPrima,
    neto,
    periodicidades,
    valueDate,
  ]);

  // Manejar la apertura del modal de configuración
  const handleOpenPeriodicidadModal = (categoria: string) => {
    setCategoriaSeleccionada(categoria);
    setModalOpen(true);
  };

  // Manejar la actualización de la periodicidad
  const handleUpdatePeriodicidad = async (
    categoria: string,
    nuevaPeriodicidad: number
  ) => {
    if (!empresaId) return;

    setLoading(true);
    try {
      // Actualizar en Firebase
      await updateCategoriaPeriodicidad(
        empresaId,
        categoria,
        nuevaPeriodicidad
      );

      // Actualizar el estado local
      setPeriodicidades((prev) => ({
        ...prev,
        [categoria]: nuevaPeriodicidad,
      }));

      // console.log(
      //   `Periodicidad de ${categoria} actualizada a ${nuevaPeriodicidad} días`
      // );
    } catch (error) {
      console.error("Error al actualizar periodicidad:", error);
      alert("Hubo un error al guardar la configuración. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.keys(periodicidades).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
        <p className="text-black font-bold text-2xl mt-1">
          Estructura de costos
        </p>
      </div>

      <div className="font-coolvetica">
        <table className="w-full text-sm text-left text-black">
          <thead className="text-black border-b h-10">
            <tr>
              <th scope="col" className="pl-4 h-10 w-2/5">
                Categoría
              </th>
              <th scope="col" className="pl-4 h-10 w-1/5">
                Total
              </th>
              <th scope="col" className="pl-4 h-10 w-1/5">
                Porcentaje
              </th>
              <th scope="col" className="pl-4 h-10 w-1/5">
                Periodicidad
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Bruto (Facturación total) */}
            <tr className="border-b h-10">
              <th scope="row" className="pl-4 font-medium">
                Bruto
              </th>
              <td className="pl-4">{formatoMoneda(facturacionTotal)}</td>
              <td className="pl-4">100%</td>
              <td className="pl-4"></td>
            </tr>

            {/* Neto */}
            <tr className="border-b h-10">
              <th scope="row" className="pl-4 font-medium">
                Neto
              </th>
              <td className="pl-4">{formatoMoneda(neto)}</td>
              <td className="pl-4">{calcularPorcentaje(neto)}</td>
              <td className="pl-4"></td>
            </tr>

            {/* Materia Prima */}
            <tr className="border-b h-10">
              <th scope="row" className="pl-4 font-medium flex items-center">
                <span>Materia Prima</span>
                <button
                  onClick={() => handleOpenPeriodicidadModal("materia prima")}
                  className="ml-2 text-gray-500 hover:text-black"
                >
                  <CogIcon />
                </button>
              </th>
              <td className="pl-4">{formatoMoneda(materiaPrima)}</td>
              <td className="pl-4">{calcularPorcentaje(materiaPrima)}</td>
              <td className="pl-4">
                {periodicidades["materia prima"] || 1} día(s)
              </td>
            </tr>

            {/* Otros gastos por categoría */}
            {Object.entries(gastosPorCategoria)
              .filter(([categoria]) => categoria !== "materia prima") // Evitamos duplicar materia prima
              .sort(([, a], [, b]) => b - a) // Ordenar por valor (mayor a menor)
              .map(([categoria, total], index) => (
                <tr key={index} className="border-b h-10">
                  <th
                    scope="row"
                    className="pl-4 font-medium capitalize flex items-center"
                  >
                    <span>{categoria}</span>
                    <button
                      onClick={() => handleOpenPeriodicidadModal(categoria)}
                      className="ml-2 text-gray-500 hover:text-black"
                    >
                      <CogIcon />
                    </button>
                  </th>
                  <td className="pl-4">{formatoMoneda(total)}</td>
                  <td className="pl-4">{calcularPorcentaje(total)}</td>
                  <td className="pl-4">
                    {periodicidades[categoria] || 1} día(s)
                  </td>
                </tr>
              ))}

            {/* Excedente */}
            <tr className="border-b h-10 bg-gray-50">
              <th scope="row" className="pl-4 font-medium">
                Excedente
              </th>
              <td className="pl-4">{formatoMoneda(excedenteValue)}</td>
              <td className="pl-4">{calcularPorcentaje(excedenteValue)}</td>
              <td className="pl-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal de configuración de periodicidad */}
      <PeriodicidadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categoria={categoriaSeleccionada}
        periodicidadActual={periodicidades[categoriaSeleccionada] || 1}
        onUpdate={handleUpdatePeriodicidad}
      />
    </div>
  );
};

export default Neto;
