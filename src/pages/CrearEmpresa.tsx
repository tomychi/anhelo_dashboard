import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearEmpresa,
  verificarTelefonoExistente,
} from "../firebase/ClientesAbsolute";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/auth/authAction";
import LoadingPoints from "../components/LoadingPoints";

export const CrearEmpresa: React.FC<{}> = () => {
  const [showFirstSection, setShowFirstSection] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Estados para los campos del formulario
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");

  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cantidadEmpleados, setCantidadEmpleados] = useState("");
  const [formaJuridica, setFormaJuridica] = useState("");

  // Estado para errores
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    // Validar campos
    if (!nombreUsuario || !telefono || !contraseña || !confirmarContraseña) {
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
      setShowFirstSection(false);
      setLoading(false);
    } catch (error) {
      console.error("Error al verificar teléfono:", error);
      setError("Error al verificar datos. Intenta nuevamente.");
      setLoading(false);
    }
  };

  const handleStart = async () => {
    // Validar campos
    if (!nombreEmpresa || !cantidadEmpleados || !formaJuridica) {
      setError("Por favor, completa todos los datos de la empresa");
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
        formaJuridica
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
        },
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
    <div className="font-coolvetica pt-12">
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

      {showFirstSection ? (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-start">
            {/* First bar animated, second bar static */}
            <div className="w-1/4 h-2 rounded-full animated-loading"></div>
            <div className="w-1/4 border-gray-400 border h-2 rounded-full"></div>
          </div>
          <h2 className="text-3xl mx-4 mt-2">Registrate</h2>
          <div className="mx-4 pt-10 flex flex-col gap-2">
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
            <div className=" mt-4 h-10 px-4 items-center text-red-main border-l-4 flex bg-red-100 border-red-main mx-4 ">
              {error}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-start">
            {/* Both bars animated in second section */}
            <div className="w-1/4 h-2 rounded-full bg-black"></div>
            <div className="w-1/4 h-2 rounded-full animated-loading"></div>
          </div>
          <h2 className="text-3xl mx-4 mt-2">
            Introduci los datos de <br /> tu empresa
          </h2>
          <div className="mx-4 pt-10 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Nombre o razon social"
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
          </div>
          <div
            className={`text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 ${loading ? "opacity-70" : "cursor-pointer"}`}
            onClick={!loading ? handleStart : undefined}
          >
            {loading ? <LoadingPoints color="text-gray-100" /> : "Comenzar"}
          </div>
          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className=" mt-4 h-10 px-4 items-center text-red-main border-l-4 flex bg-red-100 border-red-main mx-4 ">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CrearEmpresa;
