import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearEmpresa,
  verificarTelefonoExistente,
} from "../firebase/ClientesAbsolute";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/auth/authAction";
import LoadingPoints from "../components/LoadingPoints";
import arrowIcon from "../assets/arrowIcon.png";

export const CrearEmpresa: React.FC<{}> = () => {
  // Estado para controlar los pasos (1: telefono, 2: datos empresa, 3: features)
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Estados para los campos del formulario
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [rolUsuario, setRolUsuario] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cantidadEmpleados, setCantidadEmpleados] = useState("");
  const [formaJuridica, setFormaJuridica] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  // Estado para errores
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Features disponibles
  const features = [
    {
      id: "feature_dashboard",
      name: "Dashboard",
      description: "Visualiza todas tus métricas en un solo lugar",
    },
    {
      id: "feature_empleados",
      name: "Gestión de empleados",
      description: "Administra la información de tu equipo",
    },
    {
      id: "feature_ventas",
      name: "Registro de ventas",
      description: "Controla tus ingresos y transacciones",
    },
    {
      id: "feature_inventario",
      name: "Control de inventario",
      description: "Maneja tu stock y productos",
    },
    {
      id: "feature_finanzas",
      name: "Finanzas",
      description: "Administra tus gastos e ingresos",
    },
    {
      id: "feature_reportes",
      name: "Reportes",
      description: "Análisis detallado de tu negocio",
    },
  ];

  const toggleFeature = (featureId) => {
    if (selectedFeatures.includes(featureId)) {
      setSelectedFeatures(selectedFeatures.filter((id) => id !== featureId));
    } else {
      setSelectedFeatures([...selectedFeatures, featureId]);
    }
  };

  const handleContinue = async () => {
    // Validar campos
    if (!telefono || !contraseña || !confirmarContraseña) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError("");

    // Verificar si el teléfono ya existe
    try {
      const existeTelefono = await verificarTelefonoExistente(telefono);
      if (existeTelefono) {
        setError("Este número de teléfono ya está registrado.");
        setLoading(false);
        return;
      }

      // Todo bien, continuar al siguiente paso
      setCurrentStep(2);
      setLoading(false);
    } catch (error) {
      console.error("Error al verificar teléfono:", error);
      setError("Error al verificar datos. Intenta nuevamente.");
      setLoading(false);
    }
  };

  const handleNextToDatosEmpresa = async () => {
    // Validar campos
    if (
      !nombreEmpresa ||
      !nombreUsuario ||
      !cantidadEmpleados ||
      !formaJuridica ||
      !rolUsuario
    ) {
      setError("Por favor, completa todos los datos de la empresa");
      return;
    }

    setError("");
    // Avanzar al tercer paso
    setCurrentStep(3);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleStart = async () => {
    // Verificar que se haya seleccionado al menos un feature
    if (selectedFeatures.length === 0) {
      setError("Por favor, selecciona al menos un feature");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Crear la empresa en Firebase
      const empresaId = await crearEmpresa(
        nombreUsuario,
        telefono,
        contraseña,
        nombreEmpresa,
        parseInt(cantidadEmpleados), // Convertir a número
        formaJuridica,
        rolUsuario,
        selectedFeatures // Agregar los features seleccionados
      );

      console.log("Empresa creada con ID:", empresaId);

      // Crear objeto de empresa para el login
      const empresaData = {
        id: empresaId,
        datosGenerales: {
          nombre: nombreEmpresa,
          cantidadEmpleados: parseInt(cantidadEmpleados),
          formaJuridica: formaJuridica,
          fechaCreacion: new Date(),
        },
        datosUsuario: {
          nombreUsuario: nombreUsuario,
          telefono: telefono,
          contraseña: contraseña,
          rolUsuario: rolUsuario,
        },
        features: selectedFeatures,
        estado: "activo",
        ultimaActualizacion: new Date(),
      };

      // Iniciar sesión automáticamente
      dispatch(loginSuccess(empresaData));

      // Redirigir a la página principal
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al crear empresa:", error);
      setError("Error al crear la empresa. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="font-coolvetica pt-6">
      {/* Add animation styles */}
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

      {currentStep === 1 && (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-center">
            {/* First bar animated, others static */}
            <div className="w-1/6 h-2 rounded-full animated-loading"></div>
            <div className="w-1/6 border-gray-400 border h-2 rounded-full"></div>
            <div className="w-1/6 border-gray-400 border h-2 rounded-full"></div>
          </div>
          <h2 className="text-3xl mx-4 mt-2 text-center">Registrate</h2>

          <div className="mx-4 pt-14 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Tu numero de telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="password"
              placeholder="Una contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="password"
              placeholder="Repeti la contraseña"
              value={confirmarContraseña}
              onChange={(e) => setConfirmarContraseña(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
          </div>

          <div
            className={`text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 ${loading ? "opacity-70" : "cursor-pointer"}`}
            onClick={!loading ? handleContinue : undefined}
          >
            {loading ? <LoadingPoints color="text-gray-100" /> : "Continuar"}
          </div>
          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className=" mt-4 h-10 px-4 items-center text-xs text-red-main border-l-4 flex  border-red-main mx-4 ">
              {error}
            </div>
          )}
        </>
      )}

      {currentStep === 2 && (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-center">
            {/* Second bar animated, first complete, third static */}
            <div className="w-1/6 h-2 rounded-full bg-black"></div>
            <div className="w-1/6 h-2 rounded-full animated-loading"></div>
            <div className="w-1/6 border-gray-400 border h-2 rounded-full"></div>
          </div>
          <h2 className="text-3xl mx-4 mt-2 text-center">
            Introduci los datos de tu empresa
          </h2>
          <div
            className="text-gray-400 mt-2   flex-row gap-1 text-xs justify-center flex items-center cursor-pointer"
            onClick={handlePrevious}
          >
            <img
              src={arrowIcon}
              className="transform rotate-180 h-2 opacity-50"
            />
            Volver
          </div>
          <div className="mx-4 pt-14 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Nombre de la empresa o razon social"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="number"
              placeholder="Cantidad de empleados"
              value={cantidadEmpleados}
              onChange={(e) => setCantidadEmpleados(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Forma juridica"
              value={formaJuridica}
              onChange={(e) => setFormaJuridica(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Tu rol"
              value={rolUsuario}
              onChange={(e) => setRolUsuario(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
          </div>

          <div
            className={`text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 ${loading ? "opacity-70" : "cursor-pointer"}`}
            onClick={!loading ? handleNextToDatosEmpresa : undefined}
          >
            {loading ? <LoadingPoints color="text-gray-100" /> : "Continuar"}
          </div>

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className=" mt-4 h-10 px-4 items-center text-red-main border-l-4 flex text-xs border-red-main mx-4 ">
              {error}
            </div>
          )}
        </>
      )}

      {currentStep === 3 && (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-center">
            {/* First two bars complete, third animated */}
            <div className="w-1/6 h-2 rounded-full bg-black"></div>
            <div className="w-1/6 h-2 rounded-full bg-black"></div>
            <div className="w-1/6 h-2 rounded-full animated-loading"></div>
          </div>

          <h2 className="text-3xl mx-4 mt-2 text-center">
            Selecciona los features que vas a utilizar
          </h2>
          <div
            className="text-gray-400 mt-2   flex-row gap-1 text-xs justify-center flex items-center cursor-pointer"
            onClick={handlePrevious}
          >
            <img
              src={arrowIcon}
              className="transform rotate-180 h-2 opacity-50"
            />
            Volver
          </div>

          <div className="mx-4 pt-14 flex flex-col gap-3">
            {features.map((feature) => (
              <div
                key={feature.id}
                onClick={() => toggleFeature(feature.id)}
                className={`w-full p-4 h-20 rounded-3xl border border-gray-200 items-center flex flex-row gap-4 cursor-pointer transition-colors ${
                  selectedFeatures.includes(feature.id)
                    ? "bg-black text-white"
                    : "bg-gray-100"
                }`}
              >
                {/* izqueirda*/}
                <div
                  className={`w-6 h-6 items-center flex flex-shrink-0 rounded-md border ${
                    selectedFeatures.includes(feature.id)
                      ? "bg-white border-white"
                      : "border-gray-400"
                  } flex items-center justify-center `}
                ></div>

                {/* derecha */}
                <div className="flex flex-col ">
                  <h3 className="font-medium text-lg">{feature.name}</h3>
                  <p
                    className={`text-xs ${
                      selectedFeatures.includes(feature.id)
                        ? "text-gray-200"
                        : "text-gray-600"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`text-gray-100 mb-8 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 ${loading ? "opacity-70" : "cursor-pointer"}`}
            onClick={!loading ? handleStart : undefined}
          >
            {loading ? <LoadingPoints color="text-gray-100" /> : "Comenzar"}
          </div>

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className="mt-4 h-10 px-4 items-center text-xs text-red-main border-l-4 flex border-red-main mx-4">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CrearEmpresa;
