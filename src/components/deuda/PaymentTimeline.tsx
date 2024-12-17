import React, { useState, useRef, useEffect } from "react";

const TimelineRange = ({ start, end, investor, onDelete }) => {
	return (
		<div
			className="absolute h-10 bg-black bg-opacity-80 rounded-lg flex items-center justify-between px-2 cursor-pointer"
			style={{
				left: `${start}%`,
				width: `${end - start}%`,
				minWidth: "100px",
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

const PaymentTimeline = ({ investors }) => {
	const [ranges, setRanges] = useState([]);
	const [isSelecting, setIsSelecting] = useState(false);
	const [selectionStart, setSelectionStart] = useState(null);
	const [currentSelection, setCurrentSelection] = useState({
		start: 0,
		end: 0,
	});
	const [selectedInvestor, setSelectedInvestor] = useState("");
	const [showInvestorSelect, setShowInvestorSelect] = useState(false);
	const timelineRef = useRef(null);

	const getPercentageFromMouseEvent = (e) => {
		if (!timelineRef.current) return 0;
		const rect = timelineRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		return Math.max(0, Math.min(100, (x / rect.width) * 100));
	};

	const handleMouseDown = (e) => {
		const percentage = getPercentageFromMouseEvent(e);
		setIsSelecting(true);
		setSelectionStart(percentage);
		setCurrentSelection({ start: percentage, end: percentage });
	};

	const handleMouseMove = (e) => {
		if (!isSelecting) return;
		const percentage = getPercentageFromMouseEvent(e);
		setCurrentSelection({
			start: Math.min(selectionStart, percentage),
			end: Math.max(selectionStart, percentage),
		});
	};

	const handleMouseUp = () => {
		if (!isSelecting) return;
		setIsSelecting(false);
		if (currentSelection.end - currentSelection.start > 5) {
			setShowInvestorSelect(true);
		} else {
			setCurrentSelection({ start: 0, end: 0 });
		}
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
		}
	};

	const deleteRange = (index) => {
		setRanges(ranges.filter((_, i) => i !== index));
	};

	const months = [];
	const today = new Date();
	for (let i = 0; i < 12; i++) {
		const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
		months.push(
			date.toLocaleString("default", { month: "short", year: "2-digit" })
		);
	}

	return (
		<div className=" font-coolvetica">
			<p className="text-xs text-black mb-2">
				Arrastra para establecer periodos de pago
			</p>

			<div
				ref={timelineRef}
				className="relative h-10 bg-gray-300 rounded-lg  cursor-crosshair"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={() => setIsSelecting(false)}
			>
				{/* Month markers */}
				<div className="absolute  w-full flex justify-between px-2 top-1 text-xs text-gray-600">
					{months.map((month, i) => (
						<div key={i} className="text-center" style={{ width: "40px" }}>
							{month}
						</div>
					))}
				</div>

				{/* Existing ranges */}
				{ranges.map((range, i) => (
					<TimelineRange
						key={i}
						start={range.start}
						end={range.end}
						investor={range.investor}
						onDelete={() => deleteRange(i)}
					/>
				))}

				{/* Current selection */}
				{isSelecting && currentSelection.end - currentSelection.start > 0 && (
					<div
						className="absolute h-10 bg-blue-500 bg-opacity-50 rounded-lg"
						style={{
							left: `${currentSelection.start}%`,
							width: `${currentSelection.end - currentSelection.start}%`,
							minWidth: "20px",
						}}
					/>
				)}
			</div>

			{/* Investor selection dialog */}
			{showInvestorSelect && (
				<div className="">
					<select
						value={selectedInvestor}
						onChange={(e) => setSelectedInvestor(e.target.value)}
						className=" w-full mt-2 px-4  h-10 bg-gray-300 appearance-none border rounded-md "
					>
						{investors.map((investor) => (
							<option key={investor.id} value={investor.id}>
								{investor.id}
							</option>
						))}
					</select>
					<div className="flex gap-2 mt-4 ">
						<button
							onClick={addRange}
							disabled={!selectedInvestor}
							className="bg-black flex-1 h-20 font-bold text-2xl text-white px-4  rounded-md "
						>
							Confirmar
						</button>
						<button
							onClick={() => {
								setShowInvestorSelect(false);
								setCurrentSelection({ start: 0, end: 0 });
							}}
							className="bg-gray-300 text-red-main h-20 flex-1 font-bold text-2xl px-4  rounded-md"
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
