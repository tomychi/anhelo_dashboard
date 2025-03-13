import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { MaterialProps, readMateriales } from "../firebase/Materiales";
import currencyFormat from "../helpers/currencyFormat";
import arrow from "../assets/arrowIcon.png";

export const Materiales: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const [materiales, setMateriales] = useState<MaterialProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMateriales = async () => {
      try {
        setLoading(true);

        // Determinar si es ANHELO u otra empresa
        const empresaNombre =
          auth?.tipoUsuario === "empresa" && auth.usuario?.datosGenerales
            ? auth.usuario.datosGenerales.nombre || ""
            : "";

        const isAnhelo = empresaNombre === "ANHELO";

        // Determinar el ID de la empresa
        const empresaId =
          auth?.tipoUsuario === "empresa"
            ? auth.usuario?.id
            : auth?.tipoUsuario === "empleado"
              ? auth.usuario?.empresaId
              : undefined;

        const materialesData = await readMateriales(isAnhelo, empresaId);
        setMateriales(materialesData);
      } catch (error) {
        console.error("Error al obtener materiales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMateriales();
  }, [auth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtrar materiales según la búsqueda y categoría seleccionada
  const filteredMateriales = materiales.filter((material) => {
    const matchesSearch = material.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" || material.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Obtener categorías únicas para el filtro
  const uniqueCategories = [
    "Todos",
    ...new Set(materiales.map((material) => material.categoria)),
  ];

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  return (
    <div className="flex flex-col">
      <style>
        {`
          .arrow-down {
            transition: transform 0.3s ease;
            transform: rotate(90deg);
          }
          .arrow-down.open {
            transform: rotate(-90deg);
          }
        `}
      </style>
      <div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
        <p className="text-black font-bold text-4xl mt-1">Materiales</p>
        <NavLink
          className="bg-gray-200 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
          to={"/nuevoMaterial"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 mt-1"
          >
            <path
              fillRule="evenodd"
              d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          <p className="font-bold">Nuevo material</p>
        </NavLink>
      </div>

      <div className="px-4 pb-8">
        <div className="flex flex-row gap-2 mt-2">
          <div
            ref={dropdownRef}
            className="relative flex items-center pr-2 w-1/3 h-10 gap-1 rounded-lg border-4 border-black focus:ring-0 font-coolvetica justify-between text-black text-xs font-light"
          >
            <div
              className="flex flex-row items-center gap-1 cursor-pointer"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 ml-1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
                />
              </svg>
              <p
                className={
                  selectedCategory === "Todos"
                    ? "text-black text-opacity-40"
                    : ""
                }
              >
                {capitalizeFirstLetter(selectedCategory)}
              </p>
            </div>
            <img
              src={arrow}
              className={`h-2 arrow-down ${showCategoryDropdown ? "open" : ""}`}
              alt=""
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            />
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 w-full bg-gray-100 border border-gray-200 rounded-md shadow-lg z-10">
                {uniqueCategories.map((category) => (
                  <div
                    key={category}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    {capitalizeFirstLetter(category)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center w-2/3 h-10 gap-1 rounded-lg border-4 border-black focus:ring-0 font-coolvetica text-black text-xs font-light">
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
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-lg">Cargando materiales...</p>
        </div>
      ) : (
        <div className="font-coolvetica">
          <table className="w-full text-xs text-left text-black">
            <thead className="text-black border-b h-10">
              <tr>
                <th scope="col" className="pl-4 w-2/5">
                  Nombre
                </th>
                <th scope="col" className="pl-4 w-1/6">
                  Categoría
                </th>
                <th scope="col" className="pl-4 w-1/6">
                  Stock
                </th>
                <th scope="col" className="pl-4 w-1/6">
                  Costo
                </th>
                <th scope="col" className="pl-4 w-1/6"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMateriales.map((material) => (
                <tr
                  key={material.id}
                  className="text-black border font-light h-10 border-black border-opacity-20"
                >
                  <th scope="row" className="pl-4 w-2/5 font-light">
                    {capitalizeFirstLetter(material.nombre)}
                  </th>
                  <td className="pl-4 w-1/6 font-light">
                    {capitalizeFirstLetter(material.categoria)}
                  </td>
                  <td className="pl-4 w-1/6 font-light">
                    {material.stock} {material.unit}
                  </td>
                  <td className="pl-4 w-1/6 font-light">
                    {currencyFormat(material.costo)}
                  </td>
                  <td className="pl-4 pr-4 w-1/6 font-black text-2xl flex items-center justify-end h-full relative">
                    <p className="absolute top-[-4px] cursor-pointer">. . .</p>
                  </td>
                </tr>
              ))}
              {filteredMateriales.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No hay materiales que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
