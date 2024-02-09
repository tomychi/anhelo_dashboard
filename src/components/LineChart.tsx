import React from "react";
import { Line } from "react-chartjs-2";

const LineChart = ({ data }) => {
	const dates = Object.keys(data);
	const competitors = Object.keys(data[dates[0]]);

	const chartData = {
		labels: dates,
		datasets: competitors.map((competitor) => ({
			label: competitor,
			data: dates.map((date) => data[date][competitor].followers),
			fill: false,
			borderColor: "#" + ((Math.random() * 0xffffff) << 0).toString(16),
		})),
	};

	return (
		<div className="w-full">
			<Line data={chartData} />
		</div>
	);
};

export default LineChart;
