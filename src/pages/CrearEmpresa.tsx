import React from "react";

export const CrearEmpresa: React.FC<{}> = () => {
  return (
    <div className="font-coolvetica pt-20">
      <div className="flex flex-row mx-4 gap-2 justify-start ">
        <div className="w-1/3 bg-black  h-2 rounded-full"></div>
        <div className="w-1/3 bg-black h-2 rounded-full"></div>
      </div>
      <h2 className="text-3xl px-4 mt-6 ">Introduci los datos de tu empresa</h2>
    </div>
  );
};

export default CrearEmpresa;
