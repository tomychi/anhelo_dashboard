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
			startFrom={new Date("2024-02-05")}
			//       Use the separator props to change the default separator value.
			// By default the value is ~.
			separator={"hasta"}
			//       Use showShortcuts and showFooter to display or not the shortcuts and footer respectively.
			// By default both have the value false.
			showShortcuts={true}
			inputClassName="w-full uppercase rounded-none border border-2 border-red-main focus:ring-0 font-antonio text-custom-red p-4 font-black bg-black"
			toggleClassName="absolute rounded-none bg-custom-red font-antonio
text-black
font-black right-0 h-full px-3 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
			containerClassName="relative rounded-none font-antonio
text-custom-red
font-black"
			showFooter={true}
			value={value}
			onChange={handleValueChange}
		/>
	);
};
export default Calendar;
