import React, { useState, useEffect, useRef } from "react";
import {
	actualizarVouchersUsados,
	obtenerTitulosVouchers,
	obtenerCodigosCampana,
	VoucherTituloConFecha,
} from "../../firebase/voucher";
import { jsPDF } from "jspdf";
import voucherImg from "../../assets/Voucher.jpg";

// Modal Component
const VoucherModal: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	canvasRef: React.RefObject<HTMLCanvasElement>;
	handleCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
	clickPosition: { x: number; y: number } | null;
	generateVoucherPDF: () => Promise<void>;
}> = ({
	isOpen,
	onClose,
	canvasRef,
	handleCanvasClick,
	clickPosition,
	generateVoucherPDF,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
			<div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-medium">Configurar Voucher</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
					>
						×
					</button>
				</div>

				<div className="flex flex-col gap-4">
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
						disabled={!clickPosition}
						className={`font-bold rounded-lg text-center py-4 mt-2 text-xl text-gray-100 ${
							clickPosition ? "bg-black hover:bg-gray-800" : "bg-gray-400"
						} w-full transition-colors`}
					>
						{clickPosition
							? "Descargar PDF"
							: "Selecciona la posición del código"}
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
						<tr>
							<td colSpan={5} className="text-center py-4">
								Cargando campañas...
							</td>
						</tr>
					) : voucherTitles.length > 0 ? (
						voucherTitles.map((t, index) => (
							<tr
								key={index}
								className="text-black border font-light h-10 border-black border-opacity-20"
							>
								<td className="w-3/12 font-light pl-4">{t.titulo}</td>
								<td className="w-1/12 pl-4 font-light">{t.fecha}</td>
								<td className="w-1/12 pl-4 font-light">
									<p
										className={`p-1 rounded-md text-center ${getUsageColor(
											t.usados,
											t.creados
										)}`}
									>
										{t.codigos
											? t.codigos.filter((c) => c.estado === "usado").length
											: 0}
									</p>
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
						))
					) : (
						<tr>
							<td colSpan={5} className="text-center py-4">
								No hay campañas disponibles.
							</td>
						</tr>
					)}
				</tbody>
			</table>

			<VoucherModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				canvasRef={canvasRef}
				handleCanvasClick={handleCanvasClick}
				clickPosition={clickPosition}
				generateVoucherPDF={generateVoucherPDF}
			/>
		</div>
	);
};
