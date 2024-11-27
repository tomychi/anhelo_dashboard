const TableLoadingRow = () => {
	return (
		<tr>
			<td className="px-4 h-10">
				<div className="h-4 bg-gray-400 rounded animate-pulse w-16"></div>
			</td>
			<td className="px-4 h-10">
				<div className="h-4 bg-gray-400 rounded animate-pulse  w-16"></div>
			</td>
			<td className="px-4 h-10">
				<div className="h-4 bg-gray-400 rounded animate-pulse  w-6"></div>
			</td>
		</tr>
	);
};

export default TableLoadingRow;
