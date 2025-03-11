import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const CrearEmpresa: React.FC<{}> = () => {
  const [showFirstSection, setShowFirstSection] = useState(true);
  const navigate = useNavigate();

  const handleContinue = () => {
    setShowFirstSection(false);
  };

  const handleStart = () => {
    navigate("/dashboard");
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
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Tu numero de telefono"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Una contraseña"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Repeti la contraseña"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
          </div>
          <div
            className="text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 cursor-pointer"
            onClick={handleContinue}
          >
            Continuar
          </div>
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
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Cantidad de empleados"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Forma juridica"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
          </div>
          <div
            className="text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 cursor-pointer"
            onClick={handleStart}
          >
            Comenzar
          </div>
        </>
      )}
    </div>
  );
};

export default CrearEmpresa;
