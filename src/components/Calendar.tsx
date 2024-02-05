import React, { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";

const Calendar = () => {
	const [value, setValue] = useState({
		startDate: new Date(),
		endDate: new Date().setMonth(11),
	});

	const handleValueChange = (newValue) => {
		console.log("newValue:", newValue);
		setValue(newValue);
	};

	return (
		<Datepicker
			//     Use the startFrom props to change the default startFrom value.
			// By default the value is new Date()
			startFrom={new Date("2022-01-01")}
			//       Use the separator props to change the default separator value.
			// By default the value is ~.
			separator={""}
			//       Use showShortcuts and showFooter to display or not the shortcuts and footer respectively.
			// By default both have the value false.
			showShortcuts={true}
			toggleClassName="absolute bg-blue-300 rounded-r-lg text-white right-0 h-full px-3 text-gray-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
			showFooter={true}
			value={value}
			onChange={handleValueChange}
		/>
	);
};
export default Calendar;
