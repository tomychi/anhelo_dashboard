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
			canvas.width = image.width;
			canvas.height = image.height;
			ctx.drawImage(image, 0, 0);
		};

		image.onerror = () => {
			console.error("Error al cargar la imagen.");
		};

		return () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
	}, []);

	const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		const rect = canvasRef.current?.getBoundingClientRect();
		if (rect) {
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			setClickPosition({ x, y });
		}
	};

	const generateVoucherPDF = async () => {
		if (selectedVoucher) {
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

				codigosCampana.forEach((codigoData) => {
					if (voucherIndex > 0 && voucherIndex % numVouchersPerPage === 0) {
						doc.addPage();
					}

					const x = (voucherIndex % numColumns) * (voucherWidth + margin);
					const y =
						(Math.floor(voucherIndex / numColumns) % numRows) *
						(voucherHeight + margin);

					doc.addImage(voucherImg, "JPEG", x, y, voucherWidth, voucherHeight);

					const scaleX = voucherWidth / (canvasRef.current?.width || 400);
					const scaleY = voucherHeight / (canvasRef.current?.height || 300);

					const scaledX = clickPosition ? clickPosition.x * scaleX : 0;
					const scaledY = clickPosition ? clickPosition.y * scaleY : 0;

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
					doc.text(`${codigoData.codigo}`, x + scaledX, y + scaledY);

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
			alert("No se ha seleccionado un voucher para imprimir.");
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
						<th scope="col" className="pl-4 w-3/12 ">
							Campaña
						</th>
						<th scope="col" className="pl-4 w-1/12 ">
							Fecha
						</th>
						<th scope="col" className="pl-4 w-1/12 ">
							Canjeados
						</th>
						<th scope="col" className="pl-4 w-1/12 ">
							Entregados / Creados
						</th>
						<th scope="col" className="w-2/12 "></th>
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
											: 0}{" "}
									</p>
								</td>
								<td
									className="w-1/12 pl-4 font-light  cursor-pointer"
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
								<td className="w-2/12 font-bold pl-4  pr-4">
									<button
										onClick={() => {
											setSelectedVoucher(t.titulo);
											generateVoucherPDF();
										}}
										className="px-2 py-1 rounded-full  text-center text-gray-100 bg-black w-full"
									>
										PDF
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

			{selectedVoucher && (
				<>
					<h2 className="text-center my-4">
						Haz clic en la imagen para elegir la ubicación del código
					</h2>
					<canvas
						ref={canvasRef}
						width={400}
						height={300}
						style={{ border: "1px solid black" }}
						onClick={handleCanvasClick}
					/>
					<button
						onClick={generateVoucherPDF}
						className="p-1 rounded-md text-center text-gray-100 bg-green-500 w-full"
					>
						Generar Voucher
					</button>
				</>
			)}
		</div>
	);
};
