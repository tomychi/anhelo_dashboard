import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import qrcode from 'qrcode-generator';
import { readEmpleados } from "../firebase/registroEmpleados";
import Calendar from "../components/Calendar";
import { RootState } from "../redux/configureStore";
import { useSelector } from "react-redux";
import arrow from "../assets/arrowIcon.png";
import { Cadete } from "../types/types";

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
      const data = `http://192.168.0.6:5173/registroHorario`;
      qr.addData(data);
      qr.make();
      qrRef.current.innerHTML = qr.createSvgTag({
        scalable: true,
        cellSize: 4,
        margin: 1
      });
    }
  }, []);

  return <div ref={qrRef} className="w-24 h-24" />;
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

  const cadetePagas = React.useMemo(() => {
    const pagas: { [key: string]: number } = {};
    vueltas.forEach((cadete: Cadete) => {
      if (cadete.name && cadete.vueltas) {
        const totalPaga = cadete.vueltas.reduce(
          (sum, vuelta) => sum + (vuelta.paga || 0),
          0,
        );
        pagas[cadete.name] = totalPaga;
      }
    });
    return pagas;
  }, [vueltas]);

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

  const handlePayAllSalaries = async () => {
    setIsPaying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Todos los sueldos han sido pagados exitosamente");
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      alert(
        "Hubo un error al procesar el pago. Por favor, intente nuevamente.",
      );
    } finally {
      setIsPaying(false);
    }
  };

  const totalSalaries = React.useMemo(() => {
    return filteredEmpleados.reduce((total, empleado) => {
      let salary = 0;
      if (empleado.area === "cocina") {
        salary = totalProductosVendidos * 230;
      } else if (empleado.puesto === "cadete") {
        salary = cadetePagas[empleado.name] || 0;
      }
      return total + salary;
    }, 0);
  }, [filteredEmpleados, totalProductosVendidos, cadetePagas]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-center py-4 bg-gray-100">
        <QRGlobal />
      </div>

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
      <div className="flex flex-row justify-between items-center mt-8 mx-4 mb-4">
        <p className="text-black font-bold text-4xl mt-1">Equipo</p>
        <div className="flex gap-2 flex-col">
          <NavLink
            className="bg-gray-300 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
            to={"/nuevoMiembro"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 mt-1"
            >
              <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
            </svg>
            <p className="font-bold">Nuevo miembro</p>
          </NavLink>
          <button
            className={`text-black font-coolvetica bg-gray-300 font-black rounded-full flex items-center justify-center h-10 ${isPaying ? "cursor-not-allowed" : ""}`}
            onClick={handlePayAllSalaries}
            disabled={isPaying}
          >
            {isPaying ? (
              <div className="flex flex-row gap-1">
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150"></div>
              </div>
            ) : (
              <div className="ml-[-12px] flex flex-row">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 mr-2"
                >
                  <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                  <path
                    fillRule="evenodd"
                    d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
                    clipRule="evenodd"
                  />
                  <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
                </svg>
                <p className="font-bold">Pagar ${totalSalaries.toFixed(2)}</p>
              </div>
            )}
          </button>
        </div>
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
              <th scope="col" className="pl-4 w-1/6">
                Sueldo
              </th>
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
                <td className="pl-4 w-1/7 font-light">
                  {empleado.area === "cocina"
                    ? `$${totalProductosVendidos * 230}`
                    : empleado.puesto === "cadete"
                      ? `$${cadetePagas[empleado.name]
                        ? cadetePagas[empleado.name].toFixed(2)
                        : "0.00"
                      }`
                      : "$0"}
                </td>
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