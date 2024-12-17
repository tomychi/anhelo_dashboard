import React, { useState, useRef, useEffect } from "react";

const TimelineRange = ({ start, end, investor, onDelete }) => {
	return (
		<div
			className="absolute h-10 bg-black  rounded-lg flex items-center justify-between px-2 cursor-pointer"
			style={{
				left: `${start}%`,
				width: `${end - start}%`,
				minWidth: "100px",
				top: "50%",
				transform: "translateY(-50%)",
			}}
		>
			<span className="text-white text-xs truncate">{investor}</span>
			<button
				onClick={onDelete}
				className="text-white hover:text-red-300 text-xs"
			>
				×
			</button>
		</div>
	);
};

const WeekDivider = ({ left }) => (
	<div
		className="absolute h-full w-px bg-gray-400 bg-opacity-30"
		style={{ left: `${left}%` }}
	/>
);

const PaymentTimeline = ({ investors }) => {
	const [ranges, setRanges] = useState([]);
	const [isSelecting, setIsSelecting] = useState(false);
	const [currentSelection, setCurrentSelection] = useState({
		start: 0,
		end: 0,
	});
	const [selectedInvestor, setSelectedInvestor] = useState("");
	const [showInvestorSelect, setShowInvestorSelect] = useState(false);
	const timelineRef = useRef(null);

	// Calculate the date range
	const today = new Date();
	today.setDate(1); // Set to first day of the month

	const latestDeadline = investors.reduce((latest, investor) => {
		const investorLatest = Math.max(
			...investor.investments.map((inv) => inv.deadline.getTime())
		);
		return Math.max(latest, investorLatest);
	}, today.getTime());

	// Calculate the number of months between today and the latest deadline
	const monthDiff = (latestDate) => {
		const end = new Date(latestDate);
		let months = (end.getFullYear() - today.getFullYear()) * 12;
		months -= today.getMonth();
		months += end.getMonth();
		return months + 1;
	};

	const totalMonths = monthDiff(latestDeadline);
	const totalWeeks = totalMonths * 4; // 4 weeks per month

	const getPercentageFromMouseEvent = (e) => {
		if (!timelineRef.current) return 0;
		const rect = timelineRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const rawPercentage = (x / rect.width) * 100;

		// Snap to nearest week
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

	const addRange = () => {
		if (selectedInvestor) {
			setRanges([
				...ranges,
				{
					...currentSelection,
					investor: selectedInvestor,
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

	// Generate months array dynamically with first day of each month
	const generateTimelineData = () => {
		const data = [];
		const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

		for (let i = 0; i < totalMonths; i++) {
			const date = new Date(firstDay.getFullYear(), firstDay.getMonth() + i, 1);
			const month = {
				label: `${date
					.toLocaleString("es-AR", {
						month: "long",
					})
					.slice(0, 3)}`,
				weeks: [1, 2, 3, 4].map((week) => ({
					weekNum: week,
					startPercentage: (i * 4 + (week - 1)) * (100 / totalWeeks),
				})),
			};
			data.push(month);
		}
		return data;
	};

	const timelineData = generateTimelineData();

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
					className="relative h-[120px] bg-gray-300 rounded-lg cursor-crosshair"
					style={{ minWidth: `${Math.max(100, totalMonths * 8)}%` }}
					onClick={handleClick}
					onMouseMove={handleMouseMove}
				>
					{/* Month labels */}
					<div className="absolute w-full flex px-2 top-3 text-xs text-gray-600">
						{timelineData.map((month, i) => (
							<div
								key={i}
								className="text-center uppercase flex-grow"
								style={{ width: `${(400 / totalWeeks) * 4}%` }}
							>
								{month.label}
							</div>
						))}
					</div>

					{/* Week labels and dividers */}
					<div className="absolute w-full flex px-2 bottom-2 text-xs text-gray-500">
						{timelineData.map((month) =>
							month.weeks.map((week, weekIndex) => (
								<div
									key={`${month.label}-${week.weekNum}`}
									className="text-center relative"
									style={{ width: `${100 / totalWeeks}%` }}
								>
									<span className="text-[10px]">Sem {week.weekNum}</span>
									<WeekDivider left={100} />
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
						/>
					))}

					{/* Selection preview */}
					{(isSelecting || showInvestorSelect) &&
						currentSelection.end - currentSelection.start > 0 && (
							<div
								className="absolute h-10 bg-black   rounded-lg"
								style={{
									left: `${Math.min(
										currentSelection.start,
										currentSelection.end
									)}%`,
									width: `${Math.abs(
										currentSelection.end - currentSelection.start
									)}%`,
									minWidth: "20px",
									top: "50%",
									transform: "translateY(-50%)",
								}}
							/>
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
