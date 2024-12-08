import React, { useState, useEffect, useRef } from "react";
import {
	actualizarVouchersUsados,
	obtenerTitulosVouchers,
	obtenerCodigosCampana,
	VoucherTituloConFecha,
} from "../../firebase/voucher";
import { jsPDF } from "jspdf";
import voucherImg from "../../assets/Voucher.jpg";

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
	const [showImage, setShowImage] = useState(false);
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
			// Mantener la proporción original de la imagen
			const aspectRatio = image.width / image.height;
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetWidth / aspectRatio;
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
		};

		image.onerror = () => {
			console.error("Error al cargar la imagen.");
		};

		return () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
	}, [updateTrigger]);

	const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		// Calcular las coordenadas relativas al canvas considerando el escalado
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const x = (event.clientX - rect.left) * scaleX;
		const y = (event.clientY - rect.top) * scaleY;

		console.log("Posición de clic en el canvas (escalada):", x, y);
		setClickPosition({ x, y });
	};

	const handleVoucherSelect = (titulo: string) => {
		setSelectedVoucher(titulo);
		setShowImage(true);
		setClickPosition(null); // Resetear la posición al seleccionar un nuevo voucher
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

				// Obtener las dimensiones reales del canvas
				const canvas = canvasRef.current;
				if (!canvas) return;

				// Calcular la relación de escala entre el canvas y el PDF
				const pdfToCanvasScaleX = voucherWidth / canvas.width;
				const pdfToCanvasScaleY = voucherHeight / canvas.height;

				// Convertir las coordenadas del clic a coordenadas PDF
				const pdfX = clickPosition.x * pdfToCanvasScaleX;
				const pdfY = clickPosition.y * pdfToCanvasScaleY;

				codigosCampana.forEach((codigoData) => {
					if (voucherIndex > 0 && voucherIndex % numVouchersPerPage === 0) {
						doc.addPage();
					}

					const x = (voucherIndex % numColumns) * (voucherWidth + margin);
					const y =
						(Math.floor(voucherIndex / numColumns) % numRows) *
						(voucherHeight + margin);

					doc.addImage(voucherImg, "JPEG", x, y, voucherWidth, voucherHeight);

					// Agregar el número del voucher en la esquina superior derecha
					doc.setFont("helvetica", "bold");
					doc.setFontSize(6);
					doc.setTextColor(255, 255, 255);
					doc.text(`${codigoData.num}`, x + voucherWidth - 2, y + 3, {
						align: "right",
					});

					// Agregar el código del voucher en la posición seleccionada
					doc.setFontSize(8);
					doc.setTextColor(0, 0, 0);
					doc.text(`${codigoData.codigo}`, x + pdfX, y + pdfY);

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

			{showImage && (
				<div className="w-full flex flex-col px-4 pt-8">
					<div className="flex flex-row gap-2 items-center">
						<canvas
							ref={canvasRef}
							className="w-2/5 rounded-lg shadow-lg shadow-gray-300"
							onClick={handleCanvasClick}
						/>
						<h2 className="text-left text-xs">
							{clickPosition
								? "Posición seleccionada. Haz clic de nuevo para cambiarla."
								: "Haz clic en la imagen para elegir la ubicación del código"}
						</h2>
					</div>
					<button
						onClick={generateVoucherPDF}
						disabled={!clickPosition}
						className={`font-bold rounded-lg text-center h-20 mt-4 text-3xl text-gray-100 ${
							clickPosition ? "bg-black" : "bg-gray-400"
						} w-full`}
					>
						{clickPosition
							? "Descargar PDF"
							: "Selecciona la posición del código"}
					</button>
				</div>
			)}
		</div>
	);
};
