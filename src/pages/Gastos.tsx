import React, { useState, useEffect, useRef } from "react";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { NavLink } from "react-router-dom";
import { projectAuth } from "../firebase/config";
import { ExpenseProps, UpdateExpenseStatus } from "../firebase/UploadGasto";
import arrow from "../assets/arrowIcon.png";

export const Gastos: React.FC = () => {
  const { expenseData } = useSelector((state: RootState) => state.data);
  const currentUserEmail = projectAuth.currentUser?.email;
  const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

  const filteredExpenseData = isMarketingUser
    ? expenseData.filter((expense) => expense.category === "marketing")
    : expenseData;
  const [expenses, setExpenses] = useState<ExpenseProps[]>(filteredExpenseData);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openSelects, setOpenSelects] = useState<{ [key: string]: boolean }>(
    {}
  );

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "pendiente" | "pagado"
  ) => {
    try {
      await UpdateExpenseStatus(
        id,
        newStatus,
        expenses.find((exp) => exp.id === id)?.fecha || ""
      );

      setExpenses(
        expenses.map((exp) =>
          exp.id === id ? { ...exp, estado: newStatus } : exp
        )
      );
    } catch (error) {
      console.error("Error actualizando el estado:", error);
    }
  };

  const uniqueCategories = [
    "Todos",
    ...new Set(filteredExpenseData.map((expense) => expense.category)),
  ];

  useEffect(() => {
    let filtered = filteredExpenseData;

    if (selectedCategory !== "Todos") {
      filtered = filtered.filter(
        (expense) => expense.category === selectedCategory
      );
    }

    filtered = filtered.filter((expense) =>
      expense.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setExpenses(filtered);
  }, [searchTerm, selectedCategory, filteredExpenseData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }

      // Cerrar todos los selects cuando se hace clic fuera
      setOpenSelects({});
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectClick = (id: string) => {
    setOpenSelects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  return (
    <div className="flex flex-col">
      <style>
        {`
					.arrow-down {
						transition: transform 0.3s ease;
						transform: rotate(90deg); /* Inicialmente apunta hacia abajo */
					}
					.arrow-down.open {
						transform: rotate(-90deg); /* Apunta hacia arriba cuando está abierto */
					}
					.select-wrapper {
						position: relative;
						display: inline-block;
					}
					.select-wrapper select {
						appearance: none;
						padding-right: 25px;
					}
					.select-wrapper .arrow-down {
						position: absolute;
						right: 10px;
						top: 50%;
						transform: translateY(-50%) rotate(90deg); /* Ajustado para apuntar hacia abajo */
						pointer-events: none;
						transition: transform 0.3s ease;
					}
					.select-wrapper .arrow-down.open {
						transform: translateY(-50%) rotate(-90deg); /* Ajustado para apuntar hacia arriba */
					}
				`}
      </style>
      <div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
        <p className="text-black font-bold text-4xl mt-1">Gastos</p>
        <NavLink
          className="bg-gray-200 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
          onClick={toggleModal}
          to={"/nuevaCompra"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 mt-1"
          >
            <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03ZM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 0 0 .372-.648V7.93ZM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 0 0 .372.648l8.628 5.033Z" />
          </svg>
          <p className="font-bold ">Nueva compra</p>
        </NavLink>
      </div>

      <div className=" px-4 pb-8">
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
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="font-coolvetica">
        <table className="w-full text-xs text-left text-black">
          <thead className="text-black border-b h-10">
            <tr>
              <th scope="col" className="pl-4 w-2/5 ">
                Descripcion
              </th>
              <th scope="col" className="pl-4 w-1/6 ">
                Total
              </th>
              <th scope="col" className="pl-4 w-1/6 ">
                Estado
              </th>
              <th scope="col" className="pl-4 w-1/6 "></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(
              ({
                quantity,
                fecha,
                category,
                name,
                total,
                unit,
                description,
                estado,
                id,
              }) => (
                <tr
                  key={id}
                  className="text-black border font-light h-10 border-black border-opacity-20"
                >
                  <th scope="row" className="pl-4 w-1/5 font-light ">
                    {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}{" "}
                    ({quantity} u.)
                  </th>
                  <td className="pl-4 w-1/7 font-light ">
                    {currencyFormat(total)}
                  </td>
                  <td className="pl-4 w-1/7 font-bold">
                    <div className="select-wrapper ">
                      <select
                        className="bg-gray-200  py-1 pl-2   rounded-full"
                        value={estado}
                        onChange={(e) =>
                          handleStatusChange(
                            id,
                            e.target.value as "pendiente" | "pagado"
                          )
                        }
                        onClick={() => handleSelectClick(id)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                      </select>
                      <img
                        src={arrow}
                        className={`h-2 arrow-down   ${
                          openSelects[id] ? "open" : ""
                        }`}
                        alt=""
                      />
                    </div>
                  </td>
                  <td className="pl-4 pr-4 w-1/7 font-black text-2xl flex items-center justify-end h-full relative">
                    <p className="absolute top-[-4px] cursor-pointer">. . .</p>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
