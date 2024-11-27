import React from "react";
import { motion } from "framer-motion";

const LoadingElement = ({ className, width = "w-16" }) => (
	<div className={`bg-gray-200 rounded overflow-hidden ${className} ${width}`}>
		<motion.div
			className="h-full w-full bg-gradient-to-r from-gray-200 via-white to-gray-200"
			animate={{ x: ["100%", "-100%"] }}
			transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
		/>
	</div>
);

const TableLoadingRow = () => {
	return (
		<tr>
			<td className="px-4 h-10">
				<LoadingElement className="h-4" />
			</td>
			<td className="px-4 h-10">
				<LoadingElement className="h-4" />
			</td>
			<td className="px-4 h-10">
				<LoadingElement className="h-4 w-6" />
			</td>
		</tr>
	);
};

export default TableLoadingRow;
