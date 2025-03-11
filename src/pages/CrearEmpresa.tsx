import React from "react";

export const CrearEmpresa: React.FC<{}> = () => {
  return (
    <div className="font-coolvetica pt-12">
      <div className="flex flex-row mx-4 gap-2 justify-start ">
        <div className="w-1/4 bg-black h-2 rounded-full"></div>
        <div className="w-1/4 border-gray-400  border h-2 rounded-full"></div>
      </div>
      <h2 className="text-3xl mx-4 mt-2 ">Registrate</h2>
      <div className="mx-4 pt-10 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Tu numero de telefono"
          className=" w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
        />
        <input
          type="text"
          placeholder="Una contraseña"
          className=" w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
        />
        <input
          type="text"
          placeholder="Repeti la contraseña"
          className=" w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
        />
      </div>

      <div className="text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl  justify-center flex items-center mt-4">
        Continuar
      </div>

      {/* <div className="flex flex-row mx-4 gap-2 justify-start ">
        <div className="w-1/4 bg-black h-2 rounded-full"></div>
        <div className="w-1/4 bg-black h-2 rounded-full"></div>
      </div>
      <h2 className="text-3xl mx-4 mt-2 ">
        Introduci los datos de <br /> tu empresa
      </h2>
      <div className="mx-4 pt-10 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Nombre o razon social"
          className=" w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
        />
        <input
          type="text"
          placeholder="Cantidad de empleados"
          className=" w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
        />
        <input
          type="text"
          placeholder="Forma juridica"
          className=" w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
        />{" "}
      </div> */}
    </div>
  );
};

export default CrearEmpresa;
