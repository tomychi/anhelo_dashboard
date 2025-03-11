import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
import { RootState } from "../redux/configureStore";
import { useDispatch, useSelector } from "react-redux";
import {
  readExpensesData,
  readOrdersData,
  setCatedesVueltas,
  setLoading,
  setTelefonos,
  setValueDate,
} from "../redux/data/dataAction";
import {
  ReadDataForDateRange,
  readTelefonosFromFirebase,
} from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { ExpenseProps } from "../firebase/UploadGasto";
import arrow from "../assets/arrowIcon.png";
import {
  fetchCadetesVueltasByPeriod,
  fetchConstants,
} from "../firebase/Cadetes";

const Calendar = () => {
  const dispatch = useDispatch();
  const { valueDate } = useSelector((state: RootState) => state.data);

  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const handleValueDate = async (value: DateValueType) => {
    dispatch(setValueDate(value));
    dispatch(setLoading(true));

    localStorage.removeItem("mapData");

    try {
      const [ordersData, expensesData] = await Promise.all([
        ReadDataForDateRange<PedidoProps>("pedidos", value),
        ReadDataForDateRange<ExpenseProps>("gastos", value),
      ]);

      const telefonos = await readTelefonosFromFirebase();
      dispatch(setTelefonos(telefonos));

      const cadetesConVueltas = await fetchCadetesVueltasByPeriod(value);

      // Obtener los datos de sueldos para calcular las pagas
      const cadetesData = await fetchConstants();
      if (cadetesData) {
        dispatch(setCatedesVueltas(cadetesConVueltas, cadetesData));
      } else {
        console.error("No se pudieron obtener los datos de sueldos");
      }

      dispatch(readOrdersData(ordersData));
      dispatch(readExpensesData(expensesData));
    } catch (error) {
      console.error("Se produjo un error al leer los datos:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (valueDate === undefined) {
      dispatch(setValueDate(null));
    }
  }, [dispatch, valueDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCalendarClick = () => {
    setIsOpen(!isOpen);
  };

  const bgColor =
    location.pathname === "/dashboard" ? "bg-black" : " bg-gray-100 ";
  const textColor =
    location.pathname === "/dashboard" ? "text-white" : "text-black ";
  const borderColor =
    location.pathname === "/dashboard" ? " border-white" : "border-black ";
  const arrowColor =
    location.pathname === "/dashboard" ? { filter: "invert(100%)" } : {};

  return (
    <>
      <style>
        {`
          .calendar-container {
            position: relative;
          }
          .arrow-down {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%) rotate(90deg);
            pointer-events: none;
            transition: transform 0.3s ease;
          }
          .arrow-down.open {
            transform: translateY(-50%) rotate(-90deg);
          }
        `}
      </style>
      <div
        className={`calendar-container ${bgColor}`}
        ref={calendarRef}
        onClick={handleCalendarClick}
      >
        <Datepicker
          separator={"hasta"}
          i18n={"es"}
          primaryColor={"blue"}
          inputClassName={`w-full h-10 rounded-lg  border-4    md border focus:ring-0 font-coolvetica  px-4 pl-10 pr-8 ${bgColor} ${textColor} ${borderColor} text-xs font-light`}
          toggleClassName={`absolute rounded-lg      l-md font-coolvetica ${textColor} font-black left-0 h-full px-3 focus:outline-none`}
          containerClassName={`
						relative rounded-lg      md font-coolvetica ${textColor} font-black
					`}
          value={valueDate}
          onChange={handleValueDate}
          placeholder={"Desde y hasta"}
          useRange={false}
        />
        <img
          src={arrow}
          className={`h-2 arrow-down mr-1 ${isOpen ? "open" : ""}`}
          style={arrowColor}
          alt="arrow"
        />
      </div>
    </>
  );
};

export default Calendar;
