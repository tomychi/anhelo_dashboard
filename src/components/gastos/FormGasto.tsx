import React, { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { obtenerFechaActual } from "../../helpers/dateToday";
import { UploadExpense } from "../../firebase/UploadGasto";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { uploadFile } from "../../firebase/files";
import { projectAuth } from "../../firebase/config";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { UNIDADES, ESTADOS, ExpenseProps } from "../../constants/expenses";
import {
  EmpleadosProps,
  readEmpleados,
} from "../../firebase/registroEmpleados";
import arrow from "../../assets/arrowIcon.png"; // Importa icono de flecha
import { CategoriaSelector } from "./CategoriaSelector"; // Importamos el componente

// Componente FileUpload (no cambia)
interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onFileSelect(selectedFile); // Pasar el archivo seleccionado a la prop
      startUpload(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      onFileSelect(selectedFile); // Pasar el archivo seleccionado a la prop

      startUpload(selectedFile);
    }
  };

  const startUpload = (file) => {
    setUploading(true);
    setError(null);

    uploadFile(
      file,
      (progress) => setUploadProgress(progress),
      (downloadURL) => {
        console.log("Archivo subido con éxito:", downloadURL);
        setUploading(false);
      },
      (uploadError) => {
        console.error("Error al subir el archivo:", uploadError);
        setError("Hubo un error al subir el archivo. Inténtalo de nuevo.");
        setUploading(false);
      }
    );
  };

  return (
    <div
      className="w-full h-48 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        onChange={handleFileChange}
      />
      <svg
        className="w-12 h-12 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-sm text-gray-600">
        {file ? file.name : "Selecciona o arrastra un documento"}
      </p>
      {uploading && (
        <p className="text-sm text-gray-600">
          Subiendo: {Math.round(uploadProgress)}%
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

const formatDateForInput = (dateString) => {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const formatDateForDB = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

// Componente FormGasto modificado
export const FormGasto = ({ onSuccess }) => {
  const currentUserEmail = projectAuth.currentUser?.email;
  const isMarketingUser = currentUserEmail === "marketing@anhelo.com";
  const [unidadPorPrecio, setUnidadPorPrecio] = useState(0);
  const { materiales } = useSelector((state) => state.materials);
  const [file, setFile] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado para los pasos (añadimos paso 0.5 para crear categoría)
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Estado inicial para formData
  const [formData, setFormData] = useState({
    description: "",
    total: 0,
    category: "", // Lo cargaremos dinámicamente
    fecha: obtenerFechaActual(),
    name: "",
    quantity: 0,
    unit: "unidad",
    estado: "pendiente",
  });

  const auth = useSelector((state: RootState) => state.auth);
  const empresaId =
    auth?.tipoUsuario === "empresa"
      ? auth.usuario?.id
      : auth?.tipoUsuario === "empleado"
        ? auth.usuario?.empresaId
        : undefined;

  useEffect(() => {
    const fetchEmpleados = async () => {
      const empleadosData = await readEmpleados();
      setEmpleados(empleadosData);
    };
    fetchEmpleados();
  }, []);

  const [inputDateValue, setInputDateValue] = useState(
    formatDateForInput(obtenerFechaActual())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "total" || name === "quantity") {
      const numericValue = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue,
      }));
    } else if (name === "category") {
      if (value === "cocina y produccion") {
        // Mostrar los inputs de fechaInicio y fechaFin
      } else {
        setFechaInicio("");
        setFechaFin("");
      }
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDateChange = (e) => {
    const inputDate = e.target.value; // Formato YYYY-MM-DD
    setInputDateValue(inputDate);

    // Actualizar el formData con el formato DD/MM/YYYY
    setFormData((prev) => ({
      ...prev,
      fecha: formatDateForDB(inputDate),
    }));
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    const selectedMaterial = materiales.find(
      (material) => material.nombre === value
    );

    if (selectedMaterial) {
      setUnidadPorPrecio(selectedMaterial.unidadPorPrecio);
      setFormData({
        ...formData,
        name: selectedMaterial.nombre,
        quantity: 0,
        unit: selectedMaterial.unit,
        total: 0,
        description: "",
        category: selectedMaterial.categoria,
        estado: "pendiente",
      });
    } else {
      setFormData({
        ...formData,
        name: value,
        quantity: 0,
        unit: "unidad",
        total: 0,
        description: "",
        estado: "pendiente",
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.category) {
        setError("Por favor, completa todos los campos requeridos");
        return;
      }
    } else if (currentStep === 2) {
      if (formData.quantity <= 0 || formData.total <= 0) {
        setError("La cantidad y el total deben ser mayores a cero");
        return;
      }
    }

    setError("");
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const expenseWithId = { ...formData, id: "" };
      const result = await UploadExpense(
        expenseWithId,
        formData.category === "cocina y produccion" ? fechaInicio : undefined,
        formData.category === "cocina y produccion" ? fechaFin : undefined
      );

      await Swal.fire({
        icon: "success",
        title: "Gasto cargado",
        text:
          formData.category === "cocina y produccion"
            ? `Los gastos se cargaron correctamente para el período seleccionado`
            : `El gasto ${result[0].id} se cargó correctamente`,
      });

      const currentDate = formData.fecha;
      setFormData({
        description: "",
        total: 0,
        category: formData.category, // Mantener la categoría seleccionada
        fecha: currentDate,
        name: "",
        quantity: 0,
        unit: "unidad",
        estado: "pendiente",
      });
      setFechaInicio("");
      setFechaFin("");
      setFile(null);

      // Llamamos a onSuccess para cerrar el modal
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error en el proceso:", error);
      setError(`Hubo un error al cargar el gasto: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-coolvetica text-black">
      {/* Estilos para la barra de progreso animada */}
      <style>
        {`
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
        `}
      </style>

      {/* Barras de progreso */}
      <div className="flex flex-row gap-2 justify-center mb-4">
        <div
          className={`w-1/6 h-2 rounded-full ${currentStep === 1 ? "animated-loading" : currentStep > 1 ? "bg-black" : "border border-gray-200"}`}
        ></div>
        <div
          className={`w-1/6 h-2 rounded-full ${currentStep === 2 ? "animated-loading" : currentStep > 2 ? "bg-black" : "border border-gray-200"}`}
        ></div>
        <div
          className={`w-1/6 h-2 rounded-full ${currentStep === 3 ? "animated-loading" : "border border-gray-200"}`}
        ></div>
      </div>

      <div className="items-center w-full justify-center rounded-md">
        <div className="item-section w-full flex flex-col gap-2">
          {/* Paso 0.5: Crear nueva categoría */}
          {isCreatingCategory && (
            <>
              <p className="text-2xl mx-4 my-2 text-center">Nueva categoría</p>

              <div
                className="text-gray-400 mb-4 flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
                onClick={() => setIsCreatingCategory(false)}
              >
                <img
                  src={arrow}
                  className="transform rotate-180 h-2 opacity-30"
                  alt="Volver"
                />
                Volver
              </div>

              <div className="section w-full relative z-0">
                <input
                  type="text"
                  id="newCategory"
                  name="newCategory"
                  className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  value={newCategory}
                  placeholder="Nombre de la categoría"
                  onChange={(e) => setNewCategory(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!newCategory.trim()) return;

                  try {
                    setLoading(true);
                    const firestore = getFirestore();
                    const docRef = doc(
                      firestore,
                      "absoluteClientes",
                      empresaId
                    );

                    // Obtener las categorías actuales
                    const docSnap = await getDoc(docRef);
                    let existingCategories = [];

                    if (docSnap.exists()) {
                      const data = docSnap.data();
                      if (data.config && data.config.gastosCategories) {
                        existingCategories = data.config.gastosCategories;
                      } else if (
                        data.gastosCategory &&
                        data.gastosCategory.length > 0
                      ) {
                        existingCategories = data.gastosCategory;
                      }
                    }

                    // Añadir la nueva categoría
                    const updatedCategories = [
                      ...existingCategories,
                      newCategory.toLowerCase(),
                    ];

                    // Actualizar en Firestore
                    await updateDoc(docRef, {
                      "config.gastosCategories": updatedCategories,
                    });

                    // Actualizar el formulario
                    setFormData((prev) => ({
                      ...prev,
                      category: newCategory.toLowerCase(),
                    }));

                    // Volver al paso 1
                    setNewCategory("");
                    setIsCreatingCategory(false);

                    Swal.fire({
                      icon: "success",
                      title: "Categoría creada",
                      text: `La categoría "${newCategory}" se creó correctamente`,
                      timer: 2000,
                      showConfirmButton: false,
                    });
                  } catch (error) {
                    console.error("Error al guardar categoría:", error);
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "Hubo un problema al crear la categoría",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
                disabled={!newCategory.trim() || loading}
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
                  "Guardar"
                )}
              </button>
            </>
          )}

          {/* Paso 1: Detalles básicos */}
          {currentStep === 1 && !isCreatingCategory && (
            <>
              {/* Usamos el componente de categorías */}
              <CategoriaSelector
                selectedCategory={formData.category}
                onCategoryChange={(category) =>
                  setFormData((prev) => ({ ...prev, category }))
                }
                formData={formData}
                setFormData={setFormData}
                onAddCategory={() => setIsCreatingCategory(true)}
              />

              {formData.category === "cocina y produccion" ? (
                <select
                  id="name"
                  name="name"
                  className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados
                    .filter((emp) => emp.area === "cocina")
                    .map((empleado, index) => (
                      <option key={index} value={empleado.name}>
                        {empleado.name}
                      </option>
                    ))}
                </select>
              ) : formData.category === "infraestructura" ? (
                <select
                  id="name"
                  name="name"
                  className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  <option value="gas">Gas</option>
                  <option value="wifi">WiFi</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="luz">Luz</option>
                  <option value="agua">Agua</option>
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Nombre del item"
                    list={isMarketingUser ? undefined : "itemNames"}
                    required
                    autoComplete="off"
                  />
                  {!isMarketingUser && (
                    <datalist id="itemNames">
                      {materiales.map((material, index) => (
                        <option key={index} value={material.nombre} />
                      ))}
                    </datalist>
                  )}
                </>
              )}

              <div className="section w-full relative z-0">
                <input
                  type="text"
                  id="description"
                  name="description"
                  className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  value={formData.description}
                  placeholder="Descripción del ítem"
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Paso 2: Cantidades */}
          {currentStep === 2 && (
            <>
              <p className="text-2xl mx-4  text-center">Medida</p>

              <div
                className="text-gray-400 mb-4 flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
                onClick={handlePreviousStep}
              >
                <img
                  src={arrow}
                  className="transform rotate-180 h-2 opacity-30"
                  alt="Volver"
                />
                Volver
              </div>
              <div className="section relative z-0">
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity || ""}
                  className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  onChange={handleChange}
                  placeholder="Cantidad"
                  required
                />
              </div>
              <div className="section relative z-0">
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar unidad</option>
                  {UNIDADES.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="section w-full relative z-0">
                <input
                  type="number"
                  id="total"
                  name="total"
                  className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  value={formData.total || ""}
                  onChange={handleChange}
                  placeholder="$ Total"
                  required
                />
              </div>
            </>
          )}

          {/* Paso 3: Estado y fecha */}
          {currentStep === 3 && (
            <>
              <p className="text-2xl mx-4  text-center">Registro</p>

              <div
                className="text-gray-400 mb-4 flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
                onClick={handlePreviousStep}
              >
                <img
                  src={arrow}
                  className="transform rotate-180 h-2 opacity-30"
                  alt="Volver"
                />
                Volver
              </div>

              <FileUpload onFileSelect={handleFileSelect} />

              <div className="section w-full relative z-0">
                <select
                  id="estado"
                  name="estado"
                  className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              {formData.category === "cocina y produccion" ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs mt-2 font-light">Selecciona período</p>
                  <div className="flex flex-row gap-2">
                    <div className="section w-full relative z-0">
                      <p className="text-xs mb-1 font-light">Fecha inicio</p>
                      <input
                        type="date"
                        id="fechaInicio"
                        name="fechaInicio"
                        className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        required
                      />
                    </div>
                    <div className="section w-full relative z-0">
                      <p className="text-xs mb-1 font-light">Fecha fin</p>
                      <input
                        type="date"
                        id="fechaFin"
                        name="fechaFin"
                        className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="section w-full relative z-0">
                  <input
                    type="date"
                    id="fecha"
                    name="fecha"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={inputDateValue}
                    onChange={handleDateChange}
                    required
                  />
                </div>
              )}
            </>
          )}

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className="mt-4 h-10 px-4 items-center text-xs text-red-main border-l-4 flex border-red-main mb-4">
              {error}
            </div>
          )}

          {/* Botones de navegación */}
          {currentStep < 3 ? (
            <button
              type="button" /* Importante: type button para evitar submit */
              onClick={handleNextStep}
              disabled={
                !formData.category
              } /* Deshabilitar si no hay categoría seleccionada */
              className={`text-gray-100 w-full h-20 mt-2 rounded-lg ${!formData.category ? "bg-gray-400" : "bg-black"} text-4xl font-bold`}
            >
              {!formData.category ? "Selecciona una categoría" : "Continuar"}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
              disabled={loading}
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
                "Guardar"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormGasto;
