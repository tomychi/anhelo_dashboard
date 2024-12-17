import React, { useState, useRef, useEffect } from "react";

const TimelineRange = ({
	start,
	end,
	investor,
	onDelete,
	row,
	startDate,
	totalWeeks,
}) => {
	const formatDate = (percentage) => {
		const totalDays = totalWeeks * 7;
		const daysToAdd = Math.floor((percentage / 100) * totalDays);
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + daysToAdd);
		return date.toLocaleDateString("es-AR");
	};

	return (
		<div
			className="absolute h-10 bg-black rounded-lg flex flex-col items-start justify-center px-2 cursor-pointer"
			style={{
				left: `${start}%`,
				width: `${end - start}%`,
				minWidth: "100px",
				top: `${row * 40 + 60}px`,
				transform: "translateY(-50%)",
			}}
		>
			<div className="w-full flex items-center justify-between">
				<span className="text-white text-xs truncate">{investor}</span>
				<button
					onClick={onDelete}
					className="text-white hover:text-red-300 text-xs"
				>
					×
				</button>
			</div>
			<div className="text-white text-[10px] opacity-75">
				{formatDate(start)} - {formatDate(end)}
			</div>
		</div>
	);
};

const PaymentTimeline = ({ investors }) => {
	const [ranges, setRanges] = useState([]);
	const [isSelecting, setIsSelecting] = useState(false);
	const [currentSelection, setCurrentSelection] = useState({
		start: 0,
		end: 0,
	});
	const [selectedInvestor, setSelectedInvestor] = useState("");
	const [showInvestorSelect, setShowInvestorSelect] = useState(false);
	const [previewRow, setPreviewRow] = useState(0);
	const timelineRef = useRef(null);

	const calculateRow = (newStart, newEnd) => {
		const rows = ranges.map((range) => range.row || 0);
		let row = 0;

		while (true) {
			const hasOverlap = ranges.some(
				(range) =>
					range.row === row &&
					((newStart >= range.start && newStart <= range.end) ||
						(newEnd >= range.start && newEnd <= range.end) ||
						(newStart <= range.start && newEnd >= range.end))
			);

			if (!hasOverlap) {
				return row;
			}
			row++;
		}
	};

	const getStartDate = () => {
		const date = new Date();
		date.setDate(1);
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1);
		date.setDate(diff);
		return date;
	};

	const startDate = getStartDate();

	const latestDeadline = investors.reduce((latest, investor) => {
		const investorLatest = Math.max(
			...investor.investments.map((inv) => inv.deadline.getTime())
		);
		return Math.max(latest, investorLatest);
	}, startDate.getTime());

	const weekDiff = (start, end) => {
		const msInWeek = 1000 * 60 * 60 * 24 * 7;
		return Math.ceil((end - start) / msInWeek);
	};

	const totalWeeks = weekDiff(startDate.getTime(), latestDeadline);

	const percentageToDate = (percentage) => {
		const totalDays = totalWeeks * 7;
		const daysToAdd = Math.floor((percentage / 100) * totalDays);
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + daysToAdd);
		return date;
	};

	const formatDate = (percentage) => {
		const date = percentageToDate(percentage);
		return date.toLocaleDateString("es-AR");
	};

	const getPercentageFromMouseEvent = (e) => {
		if (!timelineRef.current) return 0;
		const rect = timelineRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const rawPercentage = (x / rect.width) * 100;

		const weekWidth = 100 / totalWeeks;
		const weekIndex = Math.round(rawPercentage / weekWidth);
		return Math.max(0, Math.min(100, weekIndex * weekWidth));
	};

	const handleClick = (e) => {
		const percentage = getPercentageFromMouseEvent(e);

		if (!isSelecting) {
			setIsSelecting(true);
			setCurrentSelection({
				start: percentage,
				end: percentage,
			});
		} else {
			setIsSelecting(false);
			if (Math.abs(currentSelection.end - currentSelection.start) > 2) {
				setShowInvestorSelect(true);
			} else {
				setCurrentSelection({ start: 0, end: 0 });
			}
		}
	};

	const handleMouseMove = (e) => {
		if (!isSelecting) return;
		const percentage = getPercentageFromMouseEvent(e);
		setCurrentSelection((prev) => ({
			...prev,
			end: percentage,
		}));
	};

	useEffect(() => {
		if (isSelecting || showInvestorSelect) {
			const start = Math.min(currentSelection.start, currentSelection.end);
			const end = Math.max(currentSelection.start, currentSelection.end);
			const row = calculateRow(start, end);
			setPreviewRow(row);
		}
	}, [currentSelection, isSelecting, showInvestorSelect]);

	const addRange = () => {
		if (selectedInvestor) {
			const start = Math.min(currentSelection.start, currentSelection.end);
			const end = Math.max(currentSelection.start, currentSelection.end);
			const row = calculateRow(start, end);

			setRanges([
				...ranges,
				{
					start,
					end,
					investor: selectedInvestor,
					row,
				},
			]);
			setCurrentSelection({ start: 0, end: 0 });
			setSelectedInvestor("");
			setShowInvestorSelect(false);
			setIsSelecting(false);
		}
	};

	const deleteRange = (index) => {
		setRanges(ranges.filter((_, i) => i !== index));
	};

	const generateTimelineData = () => {
		const data = [];
		let currentDate = new Date(startDate);
		let weekCounter = 1;

		let currentMonth = null;
		let monthData = null;

		for (let week = 0; week < totalWeeks; week++) {
			const monthKey = currentDate
				.toLocaleString("es-AR", {
					month: "long",
				})
				.toUpperCase();

			if (monthKey !== currentMonth) {
				currentMonth = monthKey;
				monthData = {
					label: monthKey,
					weeks: [],
				};
				data.push(monthData);
			}

			monthData.weeks.push({
				weekNum: weekCounter++,
				startPercentage: (week * 100) / totalWeeks,
				startDate: new Date(currentDate),
			});

			currentDate.setDate(currentDate.getDate() + 7);
		}

		return data;
	};

	const timelineData = generateTimelineData();

	const maxRow =
		ranges.length > 0
			? Math.max(...ranges.map((range) => range.row), previewRow)
			: previewRow;
	const timelineHeight = Math.max(120, (maxRow + 1) * 40 + 80);

	return (
		<div className="font-coolvetica">
			<p className="text-xs text-black mb-2">
				Haz click para iniciar la selección, mueve el mouse y vuelve a hacer
				click para terminar. La selección se ajustará automáticamente a las
				semanas.
			</p>

			<div className="overflow-x-auto">
				<div
					ref={timelineRef}
					className="relative bg-gray-300 rounded-lg cursor-crosshair"
					style={{
						minWidth: `${Math.max(100, totalWeeks * 2)}%`,
						height: `${timelineHeight}px`,
					}}
					onClick={handleClick}
					onMouseMove={handleMouseMove}
				>
					{/* Month labels */}
					<div className="absolute w-full flex px-2 top-3 text-xs text-gray-600">
						{timelineData.map((month, i) => (
							<div
								key={i}
								className="text-center uppercase flex-grow"
								style={{
									width: `${(month.weeks.length * 100) / totalWeeks}%`,
								}}
							>
								{month.label}
							</div>
						))}
					</div>

					{/* Week labels and dividers */}
					<div className="absolute w-full flex px-2 bottom-2 text-xs text-gray-500">
						{timelineData.flatMap((month) =>
							month.weeks.map((week, weekIndex) => (
								<div
									key={`week-${week.weekNum}`}
									className="text-center relative"
									style={{ width: `${100 / totalWeeks}%` }}
								>
									<span className="text-xs">{week.weekNum}</span>
								</div>
							))
						)}
					</div>

					{/* Ranges */}
					{ranges.map((range, i) => (
						<TimelineRange
							key={i}
							start={range.start}
							end={range.end}
							investor={range.investor}
							onDelete={() => deleteRange(i)}
							row={range.row}
							startDate={startDate}
							totalWeeks={totalWeeks}
						/>
					))}

					{/* Selection preview */}
					{(isSelecting || showInvestorSelect) &&
						currentSelection.end - currentSelection.start > 0 && (
							<div
								className="absolute h-10 bg-black bg-opacity-50 rounded-lg flex flex-col justify-center px-2"
								style={{
									left: `${Math.min(
										currentSelection.start,
										currentSelection.end
									)}%`,
									width: `${Math.abs(
										currentSelection.end - currentSelection.start
									)}%`,
									minWidth: "20px",
									top: `${previewRow * 40 + 60}px`,
									transform: "translateY(-50%)",
								}}
							>
								<div className="text-white text-[10px] opacity-75">
									{formatDate(
										Math.min(currentSelection.start, currentSelection.end)
									)}{" "}
									-{" "}
									{formatDate(
										Math.max(currentSelection.start, currentSelection.end)
									)}
								</div>
							</div>
						)}
				</div>
			</div>

			{showInvestorSelect && (
				<div className="">
					<select
						value={selectedInvestor}
						onChange={(e) => setSelectedInvestor(e.target.value)}
						className="w-full mt-2 px-4 h-10 bg-gray-300 appearance-none border rounded-md"
					>
						<option value="">Seleccionar inversor</option>
						{investors.map((investor) => (
							<option key={investor.id} value={investor.id}>
								{investor.id}
							</option>
						))}
					</select>
					<div className="flex gap-2 mt-4">
						<button
							onClick={addRange}
							disabled={!selectedInvestor}
							className="bg-black flex-1 h-20 font-bold text-2xl text-white px-4 rounded-md"
						>
							Confirmar
						</button>
						<button
							onClick={() => {
								setShowInvestorSelect(false);
								setCurrentSelection({ start: 0, end: 0 });
								setIsSelecting(false);
							}}
							className="bg-gray-300 text-red-main h-20 flex-1 font-bold text-2xl px-4 rounded-md"
						>
							Cancelar
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default PaymentTimeline;
