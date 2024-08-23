import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
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
			dispatch(setValueDate(null));
		}
	}, [dispatch, valueDate]);

	return (
		<>
			<Datepicker
				separator={"hasta"}
				primaryColor={"red"}
				showShortcuts={true}
				inputClassName="w-full h-10 rounded-md border border-white focus:ring-0 font-coolvetica text-white px-4 pl-10 bg-black text-xs font-light"
				toggleClassName="absolute rounded-l-md font-antonio text-white font-black left-0 h-full px-3 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
				containerClassName="relative rounded-md font-antonio text-black font-black"
				showFooter={true}
				value={valueDate}
				onChange={handleValueDate}
				placeholder={"Desde y hasta"}
				useRange={false}
			/>
		</>
	);
};

export default Calendar;
