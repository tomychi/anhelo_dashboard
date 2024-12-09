import React, { useState, useEffect, useRef } from "react";
import {
	actualizarVouchersUsados,
	obtenerTitulosVouchers,
	obtenerCodigosCampana,
	VoucherTituloConFecha,
} from "../../firebase/voucher";
import { jsPDF } from "jspdf";
import voucherImg from "../../assets/Voucher.jpg";
import arrow from "../../assets/arrowIcon.png";

const TableLoadingRow = () => {
	return (
		<tr className="text-black border font-light h-10 border-black border-opacity-20">
			<td className="w-3/12 pl-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
			</td>
			<td className="w-1/12 pl-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
			</td>
			<td className="w-1/12 pl-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
			</td>
			<td className="w-1/12 pl-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
			</td>
			<td className="w-2/12 pl-4 pr-4">
				<div className="h-6 bg-gray-200 rounded-full animate-pulse w-full"></div>
			</td>
		</tr>
	);
};

// Modal Component
const VoucherModal: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	canvasRef: React.RefObject<HTMLCanvasElement>;
	handleCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
	clickPosition: { x: number; y: number } | null;
	generateVoucherPDF: () => Promise<void>;
	loading: boolean;
}> = ({
	isOpen,
	onClose,
	canvasRef,
	handleCanvasClick,
	clickPosition,
	generateVoucherPDF,
	loading,
}) => {
	const [isAnimating, setIsAnimating] = useState(false);
	const [dragStart, setDragStart] = useState<number | null>(null);
	const [currentTranslate, setCurrentTranslate] = useState(0);
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true);
			setCurrentTranslate(0);
		}
	}, [isOpen]);

	const handleTouchStart = (e: React.TouchEvent) => {
		setDragStart(e.touches[0].clientY);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		setDragStart(e.clientY);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (dragStart === null) return;

		const currentPosition = e.touches[0].clientY;
		const difference = currentPosition - dragStart;

		// Solo permitir arrastrar hacia abajo
		if (difference < 0) return;

		setCurrentTranslate(difference);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (dragStart === null) return;

		const difference = e.clientY - dragStart;

		// Solo permitir arrastrar hacia abajo
		if (difference < 0) return;

		setCurrentTranslate(difference);
	};

	const handleDragEnd = () => {
		if (currentTranslate > 200) {
			// Umbral para cerrar el modal
			onClose();
		} else {
			setCurrentTranslate(0); // Volver a la posición original
		}
		setDragStart(null);
	};

	useEffect(() => {
		const handleMouseUp = () => {
			if (dragStart !== null) {
				handleDragEnd();
			}
		};

		window.addEventListener("mouseup", handleMouseUp);
		window.addEventListener("touchend", handleDragEnd);

		return () => {
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("touchend", handleDragEnd);
		};
	}, [dragStart, currentTranslate]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center">
			{/* Overlay con fade */}
			<div
				className={`absolute inset-0 bg-black transition-opacity duration-300 ${
					isAnimating ? "bg-opacity-50" : "bg-opacity-0"
				}`}
				style={{
					opacity: Math.max(0, 1 - currentTranslate / 400),
				}}
				onClick={onClose}
			/>

			{/* Modal con slide up */}
			<div
				ref={modalRef}
				className={`relative bg-white w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-12 transition-transform duration-300 touch-none ${
					isAnimating ? "translate-y-0" : "translate-y-full"
				}`}
				style={{
					transform: `translateY(${currentTranslate}px)`,
				}}
			>
				{/* Area de arrastre */}
				<div
					className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
				>
					{/* Indicador de arrastre */}
					<div className="absolute top-2 left-1/2 transform -translate-x-1/2">
						<div className="w-12 h-1 bg-gray-300 rounded-full" />
					</div>
				</div>

				<div className="flex flex-col ">
					<div className="flex flex-row gap-4 items-center">
						<div className="w-3/5">
							<canvas
								ref={canvasRef}
								className="w-full rounded-lg shadow-lg shadow-gray-300"
								onClick={handleCanvasClick}
							/>
						</div>
						<div className="w-2/5">
							<h2 className="text-sm">
								{clickPosition
									? "Posición seleccionada. Haz clic de nuevo para cambiarla."
									: "Haz clic en la imagen para elegir la ubicación del código"}
							</h2>
						</div>
					</div>

					<button
						onClick={generateVoucherPDF}
						disabled={!clickPosition || loading}
						className={`font-bold rounded-lg text-center h-20 mt-4  text-xl text-gray-100 ${
							clickPosition ? "bg-black hover:bg-gray-800" : "bg-gray-400"
						} w-full transition-colors`}
					>
						{loading ? (
							<div className="flex justify-center w-full items-center">
								<div className="flex flex-row gap-1">
									<div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
									<div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
									<div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
								</div>
							</div>
						) : clickPosition ? (
							"Descargar PDF"
						) : (
							<div className="flex flex-row justify-center items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="h-5"
								>
									<path
										fillRule="evenodd"
										d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
										clipRule="evenodd"
									/>
								</svg>
								<p className="text-2xl">Descargar PDF</p>
							</div>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export const VoucherList: React.FC = () => {
	const [voucherTitles, setVoucherTitles] = useState<VoucherTituloConFecha[]>(
		[]
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
	const [clickPosition, setClickPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(0);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const fetchVouchers = async () => {
			setLoading(true);
			try {
				const titles = await obtenerTitulosVouchers();
				setVoucherTitles(titles);
			} catch (error) {
				console.error("Error al obtener los títulos de vouchers:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchVouchers();
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			console.error("El elemento canvas no se encontró.");
			return;
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			console.error("No se pudo obtener el contexto 2D del canvas.");
			return;
		}

		const image = new Image();
		image.src = voucherImg;

		image.onload = () => {
			console.log("Imagen cargada exitosamente.");
			const aspectRatio = image.width / image.height;
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetWidth / aspectRatio;
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

			if (clickPosition) {
				ctx.save();

				const rectWidth = 70;
				const rectHeight = 24;
				const borderRadius = 6;

				const centerX = clickPosition.x;
				const centerY = clickPosition.y;

				const rectX = centerX - rectWidth / 2;
				const rectY = centerY - rectHeight / 2;

				ctx.beginPath();
				ctx.moveTo(rectX + borderRadius, rectY);
				ctx.lineTo(rectX + rectWidth - borderRadius, rectY);
				ctx.quadraticCurveTo(
					rectX + rectWidth,
					rectY,
					rectX + rectWidth,
					rectY + borderRadius
				);
				ctx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
				ctx.quadraticCurveTo(
					rectX + rectWidth,
					rectY + rectHeight,
					rectX + rectWidth - borderRadius,
					rectY + rectHeight
				);
				ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
				ctx.quadraticCurveTo(
					rectX,
					rectY + rectHeight,
					rectX,
					rectY + rectHeight - borderRadius
				);
				ctx.lineTo(rectX, rectY + borderRadius);
				ctx.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY);
				ctx.closePath();

				ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
				ctx.fill();

				ctx.fillStyle = "white";
				ctx.font = "medium 10px Coolvetica";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";

				ctx.fillText("Preview", centerX, centerY);

				ctx.restore();
			}
		};

		image.onerror = () => {
			console.error("Error al cargar la imagen.");
		};

		return () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
	}, [updateTrigger, clickPosition]);

	const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const x = (event.clientX - rect.left) * scaleX;
		const y = (event.clientY - rect.top) * scaleY;

		setClickPosition({ x, y });
		setUpdateTrigger((prev) => prev + 1);
	};

	const handleVoucherSelect = (titulo: string) => {
		setSelectedVoucher(titulo);
		setShowModal(true);
		setClickPosition(null);
		setTimeout(() => {
			setUpdateTrigger((prev) => prev + 1);
		}, 100);
	};

	const generateVoucherPDF = async () => {
		if (selectedVoucher && clickPosition) {
			console.log("Generando PDF para el voucher:", selectedVoucher);
			setLoading(true);
			try {
				const codigosCampana = await obtenerCodigosCampana(selectedVoucher);

				if (codigosCampana.length === 0) {
					alert("No se encontraron códigos para el voucher seleccionado.");
					return;
				}

				const doc = new jsPDF({
					orientation: "landscape",
					unit: "mm",
					format: [320, 450], // Tamaño SA3
				});

				const numVouchersPerPage = 36;
				const voucherWidth = 50;
				const voucherHeight = 80;
				const margin = 0;
				const numColumns = 9;
				const numRows = 4;

				let voucherIndex = 0;

				const canvas = canvasRef.current;
				if (!canvas) return;

				const pdfToCanvasScaleX = voucherWidth / canvas.width;
				const pdfToCanvasScaleY = voucherHeight / canvas.height;

				const pdfX = clickPosition.x * pdfToCanvasScaleX;
				const pdfY = clickPosition.y * pdfToCanvasScaleY;

				const finalPdfX = pdfX;
				const finalPdfY = pdfY;

				codigosCampana.forEach((codigoData) => {
					if (voucherIndex > 0 && voucherIndex % numVouchersPerPage === 0) {
						doc.addPage();
					}

					const x = (voucherIndex % numColumns) * (voucherWidth + margin);
					const y =
						(Math.floor(voucherIndex / numColumns) % numRows) *
						(voucherHeight + margin);

					doc.addImage(voucherImg, "JPEG", x, y, voucherWidth, voucherHeight);

					doc.setFont("helvetica", "bold");
					doc.setFontSize(6);
					doc.setTextColor(255, 255, 255);
					doc.text(`${codigoData.num}`, x + voucherWidth - 2, y + 3, {
						align: "right",
					});

					doc.setFontSize(8);
					doc.setTextColor(0, 0, 0);
					doc.text(`${codigoData.codigo}`, x + pdfX, y + pdfY, {
						align: "center",
						baseline: "middle",
					});

					voucherIndex++;
				});

				doc.save(`vouchers_${selectedVoucher}.pdf`);
			} catch (error) {
				console.error("Error al generar el PDF:", error);
				alert("Hubo un error al generar el PDF. Por favor, intente de nuevo.");
			} finally {
				setLoading(false);
			}
		} else {
			alert(
				"Por favor, seleccione un voucher y la posición del código antes de generar el PDF."
			);
		}
	};

	const getUsageColor = (usados: number, total: number): string => {
		const ratio = usados / total;
		if (ratio < 0.25) return "text-red-main";
		if (ratio < 0.5) return "text-yellow-500";
		return "text-green-500";
	};

	const calculatePercentage = (used: number, total: number): string => {
		if (total === 0) return "0%";
		return `${((used / total) * 100).toFixed(1)}%`;
	};

	return (
		<div className="font-coolvetica">
			<table className="w-full text-xs text-left text-black">
				<thead className="text-black border-b h-10">
					<tr>
						<th scope="col" className="pl-4 w-3/12">
							Campaña
						</th>
						<th scope="col" className="pl-4 w-1/12">
							Fecha
						</th>
						<th scope="col" className="pl-4 w-1/12">
							Canjeados
						</th>
						<th scope="col" className="pl-4 w-1/12">
							Entregados / Creados
						</th>
						<th scope="col" className="w-2/12"></th>
					</tr>
				</thead>
				<tbody>
					{loading ? (
						Array.from({ length: 8 }).map((_, index) => (
							<TableLoadingRow key={index} />
						))
					) : voucherTitles.length > 0 ? (
						voucherTitles.map((t, index) => {
							const usedCount = t.codigos
								? t.codigos.filter((c) => c.estado === "usado").length
								: 0;
							const percentage = calculatePercentage(usedCount, t.usados);

							return (
								<tr
									key={index}
									className="text-black border font-light h-10 border-black border-opacity-20"
								>
									<td className="w-3/12 font-light pl-4">{t.titulo}</td>
									<td className="w-1/12 pl-4 font-light">{t.fecha}</td>
									<td className="w-1/12 pl-4 font-light ">
										<div className="flex flex-row  gap-1">
											<p className={` ${getUsageColor(usedCount, t.creados)}`}>
												{usedCount}
											</p>
											<p className=" ">({percentage})</p>
										</div>
									</td>
									<td
										className="w-1/12 pl-4 font-light cursor-pointer"
										onClick={() => {
											const nuevaCantidadUsados = prompt(
												"Ingrese la nueva cantidad de vouchers usados:"
											);
											if (nuevaCantidadUsados !== null) {
												actualizarVouchersUsados(
													t.titulo,
													parseInt(nuevaCantidadUsados, 10)
												);
											}
										}}
									>
										{t.usados} / {t.creados}
									</td>
									<td className="w-2/12 font-bold pl-4 pr-4">
										<button
											onClick={() => handleVoucherSelect(t.titulo)}
											className="px-2 py-1 rounded-full text-center text-gray-100 bg-black w-full"
										>
											Imprimir
										</button>
									</td>
								</tr>
							);
						})
					) : (
						<></>
					)}
				</tbody>
			</table>

			{/* De momento no hace falta codear la funcionalidad de este paginator */}
			<div className="flex justify-center items-center gap-8 pt-8">
				<img src={arrow} className="h-2 rotate-180" alt="" />
				<p className="font-bold font-coolvetica text-xs">1</p>
				<img src={arrow} className="h-2" alt="" />
			</div>

			<VoucherModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				canvasRef={canvasRef}
				handleCanvasClick={handleCanvasClick}
				clickPosition={clickPosition}
				generateVoucherPDF={generateVoucherPDF}
				loading={loading}
			/>
		</div>
	);
};

export default VoucherList;
