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
			showFooter={true}
			value={value}
			onChange={handleValueChange}
		/>
	);
};
export default Calendar;
