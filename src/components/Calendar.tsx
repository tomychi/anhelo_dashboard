import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
import { RootState } from "../redux/configureStore";
import { useDispatch, useSelector } from "react-redux";
import {
	readExpensesData,
	readOrdersData,
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

const Calendar = () => {
	const dispatch = useDispatch();
	const { valueDate } = useSelector((state: RootState) => state.data);
	const [isOpen, setIsOpen] = useState(false);
	const calendarRef = useRef<HTMLDivElement>(null);
	const location = useLocation();

	const handleValueDate = async (value: DateValueType) => {
		dispatch(setValueDate(value));

		localStorage.removeItem("mapData");

		try {
			const [ordersData, expensesData] = await Promise.all([
				ReadDataForDateRange<PedidoProps>("pedidos", value),
				ReadDataForDateRange<ExpenseProps>("gastos", value),
			]);

			const telefonos = await readTelefonosFromFirebase();
			dispatch(setTelefonos(telefonos));

			dispatch(readOrdersData(ordersData));
			dispatch(readExpensesData(expensesData));
		} catch (error) {
			console.error("Se produjo un error al leer los datos:", error);
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

	const bgColor = location.pathname === "/" ? "bg-black" : " bg-gray-100 ";
	const textColor = location.pathname === "/" ? "text-white" : "text-black ";
	const borderColor =
		location.pathname === "/" ? " border-white" : "border-black ";

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
					inputClassName={`w-full h-10 rounded-md border focus:ring-0 font-coolvetica  px-4 pl-10 pr-8 ${bgColor} ${textColor} ${borderColor} text-xs font-light`}
					toggleClassName={`absolute rounded-l-md font-coolvetica ${textColor} font-black left-0 h-full px-3 focus:outline-none`}
					containerClassName={`
						relative rounded-md font-coolvetica ${textColor} font-black
					`}
					value={valueDate}
					onChange={handleValueDate}
					placeholder={"Desde y hasta"}
					useRange={false}
				/>
				<img
					src={arrow}
					className={`h-2 arrow-down mr-1 ${isOpen ? "open" : ""}`}
					style={{ filter: "invert(100%)" }}
					alt="arrow"
				/>
			</div>
		</>
	);
};

export default Calendar;
