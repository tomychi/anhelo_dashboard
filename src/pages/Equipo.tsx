import React, { useState, useEffect, useRef } from "react";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import qrcode from 'qrcode-generator';
import { readEmpleados } from "../firebase/registroEmpleados";
import Calendar from "../components/Calendar";
import { RootState } from "../redux/configureStore";
import { useSelector } from "react-redux";
import arrow from "../assets/arrowIcon.png";

interface Empleado {
  id: string;
  name: string;
  category: string;
  correo: string;
  available: boolean;
  area: string;
  puesto: string;
  depto: string;
  isWorking: boolean;
  startTime?: string;
  endTime?: string;
}

const QRGlobal: React.FC = () => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      const qr = qrcode(0, 'L');
      const data = `https://dashboard.onlyanhelo.com/registroHorario`;
      qr.addData(data);
      qr.make();
      qrRef.current.innerHTML = qr.createSvgTag({
        scalable: true,
        cellSize: 4,
        margin: 1
      });
    }
  }, []);

  return <div ref={qrRef} className="w-2/4" />;
};

export const Equipo: React.FC = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { totalProductosVendidos, vueltas } = useSelector(
    (state: RootState) => state.data,
  );
  const [isPaying, setIsPaying] = useState(false);

  const fetchEmpleados = async () => {
    try {
      const empleadosData = await readEmpleados();
      const filteredEmpleados = empleadosData.filter(
        (empleado) =>
          empleado.name !== "NO ASIGNADO" && empleado.name !== "test",
      );
      setEmpleados(filteredEmpleados);
    } catch (error) {
      console.error("Error al obtener los empleados:", error);
    }
  };

  useEffect(() => {
    const firestore = getFirestore();
    fetchEmpleados();
    const unsubscribe = onSnapshot(
      collection(firestore, "empleados"),
      fetchEmpleados,
    );
    return () => unsubscribe();
  }, []);

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



  const uniqueCategories = [
    "Todos",
    ...new Set(empleados.map((empleado) => empleado.depto)),
  ];

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredEmpleados = empleados.filter(
    (emp) =>
      (selectedCategory === "Todos" || emp.depto === selectedCategory) &&
      emp.name.toLowerCase().includes(searchTerm),
  );

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
      <div className="flex justify-center border-b border-gray-300 items-center gap-2 flex-col pb-6 mt-8  bg-gray-100">
        <QRGlobal />
        <p className="font-bold font-coolvetica">Registro horario</p>
      </div>

      <div className="flex flex-row justify-between items-center pt-6 mx-4 mb-4">
        <p className="text-black font-bold text-4xl ">Equipo</p>

      </div>

      <div className="px-4 pb-8">
        <Calendar />
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
              <div className="absolute top-full left-0 w-full bg-gray-100 border border-gray-300 rounded-md shadow-lg z-10">
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
              placeholder="Buscar miembro"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>
      </div>


      <div className="font-coolvetica">
        <table className="w-full text-xs text-left text-black">
          <thead className="text-black border-b h-10">
            <tr>
              <th scope="col" className="pl-4 w-2/5">Nombre
              </th>
              {/* <th scope="col" className="pl-4 w-1/6">
                Sueldo
              </th> */}
              <th scope="col" className="pl-4 w-1/6">
                Puesto
              </th>
              <th scope="col" className="pl-4 w-1/6">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmpleados.map((empleado) => (
              <tr
                key={empleado.name}
                className="text-black border font-light h-10 border-black border-opacity-20"
              >
                <th scope="row" className="pl-4 w-1/5 font-light">
                  {capitalizeFirstLetter(empleado.name)}
                </th>
                {/* <td className="pl-4 w-1/7 font-light">
                  {empleado.area === "cocina"
                    ? `$${totalProductosVendidos * 230}`
                    : empleado.puesto === "cadete"
                      ? `$${cadetePagas[empleado.name]
                        ? cadetePagas[empleado.name].toFixed(2)
                        : "0.00"
                      }`
                      : "$0"}
                </td> */}
                <td className="pl-4 w-1/7 font-light">
                  {capitalizeFirstLetter(empleado.puesto)}
                </td>
                <td className="pl-4 w-1/7 font-light">
                  <span className={`${empleado.isWorking ? "text-green-500" : "text-red-500"}`}>
                    {empleado.isWorking ? (
                      `Entrada: ${empleado.startTime}`
                    ) : empleado.endTime ? (
                      `Salida: ${empleado.endTime}`
                    ) : "✗"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Equipo;