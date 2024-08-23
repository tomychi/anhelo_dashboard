import Datepicker, {
	DatepickerType,
	DateValueType,
} from "react-tailwindcss-datepicker";
import { RootState } from "../redux/configureStore";
import { useDispatch, useSelector } from "react-redux";
import {
	readExpensesData,
	readOrdersData,
	setTelefonos,
	setValueDate,
} from "../redux/data/dataAction";
import { useEffect } from "react";
import { formatDate } from "../helpers/dateToday";
import {
	ReadDataForDateRange,
	readTelefonosFromFirebase,
} from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { ExpenseProps } from "../firebase/UploadGasto";

const Calendar = () => {
	const dispatch = useDispatch();
	const { valueDate } = useSelector((state: RootState) => state.data);
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
			dispatch(
				setValueDate({
					startDate: formatDate(new Date()),
					endDate: formatDate(new Date()),
				})
			);
		}
	}, [dispatch, valueDate]);

	const datepickerProps: DatepickerType = {
		separator: "hasta",
		primaryColor: "red",
		showShortcuts: true,
		inputClassName:
			"pl-10 w-full uppercase rounded-md border border-white focus:ring-0 font-antonio text-white p-4 font-black bg-black !important",
		toggleClassName:
			"absolute text-white font-antonio font-black left-2 top-1/2 transform -translate-y-1/2 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed",
		containerClassName:
			"relative rounded-md font-antonio text-black font-black overflow-hidden",
		showFooter: true,
		value: valueDate,
		onChange: handleValueDate,
	};

	return (
		<>
			<style>
				{`
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-input-container {
            display: flex;
            flex-direction: row-reverse;
            border-radius: 0.375rem; /* rounded-md */
            overflow: hidden;
          }
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-input-container .react-tailwindcss-datepicker-input {
            background-color: black !important;
            color: white !important;
            border-radius: 0.375rem; /* rounded-md */
          }
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-input-container .react-tailwindcss-datepicker-toggle-button {
            background: none !important;
            border: none !important;
          }
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-input-container .react-tailwindcss-datepicker-toggle-button svg {
            fill: white;
          }
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-content {
            background-color: #f3f4f6 !important; /* gray-100 */
            border: 1px solid black !important;
            border-radius: 0.375rem; /* rounded-md */
            overflow: hidden;
          }
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-content .react-tailwindcss-datepicker-calendar-section {
            background-color: #f3f4f6 !important;
          }
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-content .react-tailwindcss-datepicker-calendar-section .react-tailwindcss-datepicker-calendar-days-section {
            background-color: #f3f4f6 !important;
          }
          .react-tailwindcss-datepicker .react-tailwindcss-datepicker-content .react-tailwindcss-datepicker-calendar-section .react-tailwindcss-datepicker-calendar-days-section .react-tailwindcss-datepicker-calendar-days {
            background-color: #f3f4f6 !important;
          }
        `}
			</style>
			<Datepicker {...datepickerProps} />
		</>
	);
};

export default Calendar;
