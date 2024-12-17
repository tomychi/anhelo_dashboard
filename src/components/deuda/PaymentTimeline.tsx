import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateInversion } from "../../firebase/Inversion";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const TimelineRange = ({
	start,
	end,
	investment,
	onDelete,
	row,
	startDate,
	totalWeeks,
}) => {
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
				<span className="text-white text-xs truncate">
					{investment.investorId} ({investment.investmentIndex + 1}/
					{investment.totalInvestments}): {investment.monto} {investment.moneda}
				</span>
				<button
					onClick={onDelete}
					className="text-white hover:text-red-300 text-xs"
				>
					×
				</button>
			</div>
			<div className="text-white text-[10px] opacity-75">
				{investment.inicioEstimado?.toLocaleDateString("es-AR")} -
				{investment.finEstimado?.toLocaleDateString("es-AR")}
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
	const [selectedInvestment, setSelectedInvestment] = useState(null);
	const [showInvestmentSelect, setShowInvestmentSelect] = useState(false);
	const [previewRow, setPreviewRow] = useState(0);
	const timelineRef = useRef(null);

	// Flatten all investments with their investor information and convert dates
	const allInvestments = investors.flatMap((investor) =>
		investor.investments.map((investment, index) => {
			// Convertir todas las fechas a objetos Date
			const convertedInvestment = {
				...investment,
				deadline:
					investment.deadline instanceof Date
						? investment.deadline
						: investment.deadline?.toDate(),
				inicioEstimado:
					investment.inicioEstimado instanceof Date
						? investment.inicioEstimado
						: investment.inicioEstimado?.toDate(),
				finEstimado:
					investment.finEstimado instanceof Date
						? investment.finEstimado
						: investment.finEstimado?.toDate(),
				investorId: investor.id,
				investmentIndex: index,
				totalInvestments: investor.investments.length,
			};
			return convertedInvestment;
		})
	);

	const calculateRow = (
		newStart,
		newEnd,
		excludeIndex = -1,
		existingRanges = ranges
	) => {
		let row = 0;
		const maxRow = 50; // Límite de seguridad para evitar bucles infinitos

		while (row < maxRow) {
			const hasOverlap = existingRanges.some(
				(range, index) =>
					index !== excludeIndex &&
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

		return 0; // Fallback por seguridad
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

	const latestDeadline = Math.max(
		...allInvestments.map((inv) => inv.deadline.getTime())
	);

	const weekDiff = (start, end) => {
		const msInWeek = 1000 * 60 * 60 * 24 * 7;
		return Math.ceil((end - start) / msInWeek);
	};

	const totalWeeks = weekDiff(startDate.getTime(), latestDeadline);

	const formatDate = (percentage) => {
		const totalDays = totalWeeks * 7;
		const daysToAdd = Math.floor((percentage / 100) * totalDays);
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + daysToAdd);
		return date.toLocaleDateString("es-AR");
	};

	const calculatePositionForInvestment = (investment) => {
		if (!investment.inicioEstimado || !investment.finEstimado) return null;

		const inicioEstimado =
			investment.inicioEstimado instanceof Date
				? investment.inicioEstimado
				: investment.inicioEstimado.toDate();

		const finEstimado =
			investment.finEstimado instanceof Date
				? investment.finEstimado
				: investment.finEstimado.toDate();

		const start =
			((inicioEstimado.getTime() - startDate.getTime()) /
				(totalWeeks * 7 * 24 * 60 * 60 * 1000)) *
			100;
		const end =
			((finEstimado.getTime() - startDate.getTime()) /
				(totalWeeks * 7 * 24 * 60 * 60 * 1000)) *
			100;

		return { start, end };
	};

	useEffect(() => {
		const initialRanges = allInvestments
			.filter((inv) => inv.inicioEstimado && inv.finEstimado)
			.map((investment) => {
				const position = calculatePositionForInvestment(investment);
				if (!position) return null;

				return {
					start: position.start,
					end: position.end,
					investment,
				};
			})
			.filter(Boolean);

		// Ordenar las barras por fecha de inicio para asegurar consistencia
		const sortedRanges = [...initialRanges].sort((a, b) => a.start - b.start);

		// Asignar filas secuencialmente, verificando solapamientos
		const rangesWithRows = sortedRanges.reduce((acc, range) => {
			const row = calculateRow(
				range.start,
				range.end,
				-1,
				acc.map((r) => ({ start: r.start, end: r.end, row: r.row }))
			);

			acc.push({
				...range,
				row,
			});

			return acc;
		}, []);

		setRanges(rangesWithRows);
	}, [investors]);

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
				setShowInvestmentSelect(true);
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
		if (isSelecting || showInvestmentSelect) {
			const start = Math.min(currentSelection.start, currentSelection.end);
			const end = Math.max(currentSelection.start, currentSelection.end);
			const row = calculateRow(start, end);
			setPreviewRow(row);
		}
	}, [currentSelection, isSelecting, showInvestmentSelect]);

	// En PaymentTimeline.js, modifica la función addRange:

	const addRange = async () => {
		if (selectedInvestment) {
			const start = Math.min(currentSelection.start, currentSelection.end);
			const end = Math.max(currentSelection.start, currentSelection.end);
			const row = calculateRow(start, end);

			const totalDays = totalWeeks * 7;
			const startDays = Math.floor((start / 100) * totalDays);
			const endDays = Math.floor((end / 100) * totalDays);

			const inicioEstimado = new Date(startDate);
			inicioEstimado.setDate(startDate.getDate() + startDays);

			const finEstimado = new Date(startDate);
			finEstimado.setDate(startDate.getDate() + endDays);

			const investor = investors.find(
				(inv) => inv.id === selectedInvestment.investorId
			);

			if (investor) {
				// Crear una copia del array de inversiones
				const updatedInvestments = [...investor.investments];

				// Actualizar la inversión específica
				updatedInvestments[selectedInvestment.investmentIndex] = {
					...updatedInvestments[selectedInvestment.investmentIndex],
					inicioEstimado,
					finEstimado,
				};

				try {
					const firestore = getFirestore();
					const inversionDoc = doc(firestore, "inversion", investor.id);

					// Actualizar todo el documento con el array actualizado
					await setDoc(inversionDoc, {
						investments: updatedInvestments,
					});

					// Actualizar el estado local de ranges
					const newRange = {
						start,
						end,
						investment: {
							...selectedInvestment,
							inicioEstimado,
							finEstimado,
						},
						row,
					};

					// Reemplazar el range existente si ya existe
					const existingRangeIndex = ranges.findIndex(
						(range) =>
							range.investment.investorId === selectedInvestment.investorId &&
							range.investment.investmentIndex ===
								selectedInvestment.investmentIndex
					);

					if (existingRangeIndex !== -1) {
						setRanges(
							ranges.map((range, index) =>
								index === existingRangeIndex ? newRange : range
							)
						);
					} else {
						setRanges([...ranges, newRange]);
					}
				} catch (error) {
					console.error("Error al actualizar la inversión:", error);
					alert("Error al actualizar la inversión");
				}
			}

			setCurrentSelection({ start: 0, end: 0 });
			setSelectedInvestment(null);
			setShowInvestmentSelect(false);
			setIsSelecting(false);
		}
	};

	const deleteRange = async (index) => {
		const rangeToDelete = ranges[index];
		const investor = investors.find(
			(inv) => inv.id === rangeToDelete.investment.investorId
		);

		if (investor) {
			const allInvestments = [...investor.investments];
			const investmentIndex = rangeToDelete.investment.investmentIndex;

			// Actualizamos la inversión específica en el array
			allInvestments[investmentIndex] = {
				deadline: allInvestments[investmentIndex].deadline,
				moneda: allInvestments[investmentIndex].moneda,
				monto: allInvestments[investmentIndex].monto,
			};

			// Actualizamos todo el documento con el nuevo array de inversiones
			const firestore = getFirestore();
			const inversionDoc = doc(firestore, "inversion", investor.id);

			try {
				await setDoc(inversionDoc, {
					investments: allInvestments,
				});
			} catch (error) {
				console.error("Error al actualizar las inversiones:", error);
			}
		}

		setRanges(ranges.filter((_, i) => i !== index));
	};

	const generateTimelineData = () => {
		const data = [];
		let currentDate = new Date(startDate);

		for (let week = 0; week < totalWeeks; week++) {
			const monthKey = format(currentDate, "MMMM", {
				locale: es,
			}).toUpperCase();

			let monthData = data.find((m) => m.label === monthKey);
			if (!monthData) {
				monthData = {
					label: monthKey,
					weeks: [],
				};
				data.push(monthData);
			}

			monthData.weeks.push({
				weekNum: week + 1,
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

					<div className="absolute w-full flex px-2 bottom-2 text-xs text-gray-500">
						{timelineData.flatMap((month) =>
							month.weeks.map((week) => (
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

					{ranges.map((range, i) => (
						<TimelineRange
							key={i}
							start={range.start}
							end={range.end}
							investment={range.investment}
							onDelete={() => deleteRange(i)}
							row={range.row}
							startDate={startDate}
							totalWeeks={totalWeeks}
						/>
					))}

					{(isSelecting || showInvestmentSelect) &&
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

			{showInvestmentSelect && (
				<div className="">
					<select
						value={selectedInvestment ? JSON.stringify(selectedInvestment) : ""}
						onChange={(e) => {
							if (!e.target.value) {
								setSelectedInvestment(null);
								return;
							}
							const parsed = JSON.parse(e.target.value);
							parsed.deadline = new Date(parsed.deadline);
							setSelectedInvestment(parsed);
						}}
						className="w-full mt-2 px-4 h-10 bg-gray-300 appearance-none border rounded-md"
					>
						<option value="">Seleccionar inversión</option>
						{investors
							.map((investor) => {
								const investmentsWithIndices = investor.investments.map(
									(investment, originalIndex) => ({
										...investment,
										originalIndex,
									})
								);

								const availableInvestments = investmentsWithIndices.filter(
									(investment) => {
										return !ranges.some((range) => {
											const rangeDeadline = new Date(range.investment.deadline);
											const investmentDeadline = new Date(investment.deadline);

											return (
												range.investment.investorId === investor.id &&
												range.investment.monto === investment.monto &&
												range.investment.moneda === investment.moneda &&
												rangeDeadline.getTime() === investmentDeadline.getTime()
											);
										});
									}
								);

								if (availableInvestments.length === 0) return null;

								return (
									<optgroup key={investor.id} label={investor.id}>
										{availableInvestments.map((investment) => (
											<option
												key={`${investor.id}-${investment.originalIndex}`}
												value={JSON.stringify({
													...investment,
													investorId: investor.id,
													investmentIndex: investment.originalIndex,
													totalInvestments: investor.investments.length,
												})}
											>
												{investor.id} ({investment.originalIndex + 1}/
												{investor.investments.length}): {investment.monto}{" "}
												{investment.moneda} -{" "}
												{new Date(investment.deadline).toLocaleDateString(
													"es-AR"
												)}
											</option>
										))}
									</optgroup>
								);
							})
							.filter(Boolean)}
					</select>
					<div className="flex gap-2 mt-4">
						<button
							onClick={addRange}
							disabled={!selectedInvestment}
							className="bg-black flex-1 h-20 font-bold text-2xl text-white px-4 rounded-md"
						>
							Confirmar
						</button>
						<button
							onClick={() => {
								setShowInvestmentSelect(false);
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
