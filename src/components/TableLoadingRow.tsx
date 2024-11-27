import React from "react";

const TableLoadingRow = () => {
	return (
		<tr>
			<td className="px-4 h-10">
				<div className="h-4 bg-gray-400 rounded animate-pulse w-20"></div>
			</td>
			<td className="px-4 h-10">
				<div className="h-4 bg-gray-400 rounded animate-pulse  w-24"></div>
			</td>
			<td className="px-4 h-10">
				<div className="h-4 bg-gray-400 rounded animate-pulse w-10"></div>
			</td>
		</tr>
	);
};

export default TableLoadingRow;
