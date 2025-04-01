import React, { useState, useEffect, useRef } from "react";
import {
  actualizarVouchersUsados,
  obtenerTitulosVouchers,
  obtenerCodigosCampana,
  VoucherTituloConFecha,
} from "../../firebase/voucher";
import { jsPDF } from "jspdf";
import { projectAuth } from "../../firebase/config";
import voucherImg from "../../assets/voucher.png";
import arrow from "../../assets/arrowIcon.png";
import { NavLink } from "react-router-dom";
import VoucherModal from "./VoucherModal";

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

export const VoucherList = () => {
  const [voucherTitles, setVoucherTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [clickPositions, setClickPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [numCodes, setNumCodes] = useState(1);
  const canvasRef = useRef(null);

  // Nuevo estado para controlar si es una campaña mixta
  const [isMixedCampaign, setIsMixedCampaign] = useState(false);

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const titles = await obtenerTitulosVouchers();
        setVoucherTitles(titles);

        const groupedCampaigns = titles.reduce((acc, voucher) => {
          if (voucher.group) {
            if (!acc[voucher.group]) {
              acc[voucher.group] = {
                totalUsados: 0,
                totalCreados: 0,
                vouchers: [],
              };
            }
            acc[voucher.group].totalUsados += voucher.codigos
              ? voucher.codigos.filter((c) => c.estado === "usado").length
              : 0;
            acc[voucher.group].totalCreados += voucher.creados || 0;
            acc[voucher.group].vouchers.push(voucher.titulo);
          }
          return acc;
        }, {});

        // console.log("=== CAMPAÑAS AGRUPADAS ===", groupedCampaigns);
      } catch (error) {
        console.error("Error al obtener los títulos de vouchers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Actualizado para incluir rotación predeterminada en 0
    setClickPositions((prev) => {
      const currentRotation = 0; // Rotación predeterminada
      if (prev.length >= (isMixedCampaign ? 6 : numCodes)) {
        return [{ x, y, rotation: currentRotation }];
      }
      return [...prev, { x, y, rotation: currentRotation }];
    });
  };

  const handleVoucherSelect = async (titulo) => {
    setSelectedVoucher(titulo);
    setClickPositions([]);

    // Verificar si la campaña tiene códigos mixtos
    try {
      const codigos = await obtenerCodigosCampana(titulo);
      const hasFreeCodes = codigos.some((c) => c.gratis === true);
      const hasNormalCodes = codigos.some((c) => c.gratis === undefined);

      // Es una campaña mixta si tiene ambos tipos de códigos
      const esMixta = hasFreeCodes && hasNormalCodes;
      setIsMixedCampaign(esMixta);

      // Si es mixta, no necesitamos el numCodes, siempre serán 6 (1 gratis + 5 normales)
      if (!esMixta) {
        setNumCodes(1); // Por defecto para campañas no mixtas
      }
    } catch (error) {
      console.error("Error al verificar tipo de campaña:", error);
      setIsMixedCampaign(false);
    }

    setShowModal(true);
  };

  // Función actualizada para generar PDF con rotación de códigos
  const generateVoucherPDF = async () => {
    if (isMixedCampaign) {
      // Si es una campaña mixta, necesitamos 6 posiciones (1 gratis + 5 normales)
      if (selectedVoucher && clickPositions.length === 6) {
        setLoading(true);
        try {
          const codigosCampana = await obtenerCodigosCampana(selectedVoucher);

          if (codigosCampana.length === 0) {
            alert("No se encontraron códigos para el voucher seleccionado.");
            return;
          }

          // Separar códigos gratuitos y normales
          const codigosGratis = codigosCampana.filter((c) => c.gratis === true);
          const codigosNormales = codigosCampana.filter(
            (c) => c.gratis === undefined
          );

          // Verificar que tenemos suficientes códigos de cada tipo
          if (codigosGratis.length === 0) {
            alert("Esta campaña no tiene códigos gratuitos.");
            return;
          }

          if (codigosNormales.length === 0) {
            alert("Esta campaña no tiene códigos normales.");
            return;
          }

          // Calcular cuántos vouchers podemos crear
          const maxVouchers = Math.min(
            codigosGratis.length,
            Math.floor(codigosNormales.length / 5)
          );

          if (maxVouchers === 0) {
            alert(
              "No hay suficientes códigos para crear vouchers. Necesitas al menos 1 código gratis y 5 códigos normales."
            );
            return;
          }

          const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: [320, 450],
          });

          const numVouchersPerPage = 36;
          const voucherWidth = 50;
          const voucherHeight = 80;
          const margin = 0;
          const numColumns = 9;
          const numRows = 4;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const pdfToCanvasScaleX = voucherWidth / canvas.width;
          const pdfToCanvasScaleY = voucherHeight / canvas.height;

          // Posiciones definidas por el usuario con sus rotaciones
          const gratisPosition = clickPositions[0]; // La primera posición es para el código gratis
          const normalesPositions = clickPositions.slice(1); // El resto son para códigos normales

          // Para cada voucher
          for (let i = 0; i < maxVouchers; i++) {
            if (i > 0 && i % numVouchersPerPage === 0) {
              doc.addPage();
            }

            const x = (i % numColumns) * (voucherWidth + margin);
            const y =
              (Math.floor(i / numColumns) % numRows) * (voucherHeight + margin);

            // Añadir la imagen del voucher
            doc.addImage(voucherImg, "JPEG", x, y, voucherWidth, voucherHeight);

            // Añadir número de voucher
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6);
            doc.setTextColor(255, 255, 255);
            doc.text(`${i + 1}`, x + voucherWidth - 2, y + 3, {
              align: "right",
            });

            // 1. Añadir el código gratis con rotación
            const codigoGratis = codigosGratis[i];
            const gratisPdfX = x + gratisPosition.x * pdfToCanvasScaleX;
            const gratisPdfY = y + gratisPosition.y * pdfToCanvasScaleY;
            const gratisRotation = gratisPosition.rotation || 0;

            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);

            // Aplicar rotación si es necesario
            if (gratisRotation !== 0) {
              // Usar directamente la opción 'angle' del método text
              doc.text(codigoGratis.codigo, gratisPdfX, gratisPdfY, {
                angle: gratisRotation,
                align: "center",
                baseline: "middle",
              });
            } else {
              doc.text(codigoGratis.codigo, gratisPdfX, gratisPdfY, {
                align: "center",
                baseline: "middle",
              });
            }

            // 2. Añadir los 5 códigos normales con sus rotaciones
            for (let j = 0; j < 5; j++) {
              const codigoNormal = codigosNormales[i * 5 + j];
              const normalPosition = normalesPositions[j];

              const normalPdfX = x + normalPosition.x * pdfToCanvasScaleX;
              const normalPdfY = y + normalPosition.y * pdfToCanvasScaleY;
              const normalRotation = normalPosition.rotation || 0;

              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);

              // Aplicar rotación si es necesario
              if (normalRotation !== 0) {
                // Usar directamente la opción 'angle' del método text
                doc.text(codigoNormal.codigo, normalPdfX, normalPdfY, {
                  angle: normalRotation,
                  align: "center",
                  baseline: "middle",
                });
              } else {
                doc.text(codigoNormal.codigo, normalPdfX, normalPdfY, {
                  align: "center",
                  baseline: "middle",
                });
              }
            }
          }

          doc.save(`vouchers_mixtos_${selectedVoucher}.pdf`);
          alert(
            `Se han generado ${maxVouchers} vouchers mixtos (1 gratis + 5 normales por voucher).`
          );
        } catch (error) {
          console.error("Error al generar el PDF:", error);
          alert("Hubo un error al generar el PDF: " + error.message);
        } finally {
          setLoading(false);
        }
      } else {
        alert(
          "Por favor, seleccione un voucher y posicione todos los códigos (1 gratis + 5 normales)."
        );
      }
    } else {
      // Versión original para campañas normales
      if (selectedVoucher && clickPositions.length === numCodes) {
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
            format: [320, 450],
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

          // Group codes by voucher
          for (let i = 0; i < codigosCampana.length; i += numCodes) {
            const codesForThisVoucher = codigosCampana.slice(i, i + numCodes);

            if (voucherIndex > 0 && voucherIndex % numVouchersPerPage === 0) {
              doc.addPage();
            }

            const x = (voucherIndex % numColumns) * (voucherWidth + margin);
            const y =
              (Math.floor(voucherIndex / numColumns) % numRows) *
              (voucherHeight + margin);

            // Add the voucher image
            doc.addImage(voucherImg, "JPEG", x, y, voucherWidth, voucherHeight);

            // Add voucher number
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6);
            doc.setTextColor(255, 255, 255);
            const voucherNumber = Math.floor(i / numCodes) + 1;
            doc.text(`${voucherNumber}`, x + voucherWidth - 2, y + 3, {
              align: "right",
            });

            // Add each code at its corresponding position with rotation
            codesForThisVoucher.forEach((codigoData, index) => {
              if (index < clickPositions.length) {
                const position = clickPositions[index];
                const pdfX = x + position.x * pdfToCanvasScaleX;
                const pdfY = y + position.y * pdfToCanvasScaleY;
                const rotation = position.rotation || 0;

                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);

                // Aplicar rotación si es necesario
                if (rotation !== 0) {
                  doc.text(codigoData.codigo, pdfX, pdfY, {
                    angle: rotation,
                    align: "left", // Cambiar de "center" a "left"
                    baseline: "middle",
                  });
                } else {
                  doc.text(codigoData.codigo, pdfX, pdfY, {
                    align: "center",
                    baseline: "middle",
                  });
                }
              }
            });

            voucherIndex++;
          }

          doc.save(`vouchers_${selectedVoucher}.pdf`);
        } catch (error) {
          console.error("Error al generar el PDF:", error);
          alert(
            "Hubo un error al generar el PDF. Por favor, intente de nuevo."
          );
        } finally {
          setLoading(false);
        }
      } else {
        alert(
          "Por favor, seleccione un voucher y todas las posiciones de los códigos antes de generar el PDF."
        );
      }
    }
  };

  const getUsageColor = (usados: number, total: number): string => {
    if (total === 0) return "bg-red-main";

    const percentage = (usados / total) * 100;

    if (percentage < 5) return "bg-red-main";
    if (percentage < 10) return "bg-yellow-500";
    return "bg-green-500";
  };

  const calculatePercentage = (used: number, total: number): string => {
    if (total === 0) return "0%";
    return `${((used / total) * 100).toFixed(1)}%`;
  };

  const formatearFecha = (fecha: string): string => {
    try {
      if (fecha.includes("-")) {
        const [year, month, day] = fecha.split("-");
        return `${day}/${month}/${year}`;
      }

      if (fecha.includes("/")) {
        const parts = fecha.split("/");
        if (parts[2].length === 4) {
          return fecha;
        } else {
          return `${parts[0]}/${parts[1]}/20${parts[2]}`;
        }
      }

      return fecha;
    } catch (error) {
      console.error("Error al formatear la fecha:", error);
      return fecha;
    }
  };

  const currentUserEmail = projectAuth.currentUser?.email;
  const isMarketingUser = true;

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

              if (t.group) {
                const isFirstInGroup =
                  index === 0 || t.group !== voucherTitles[index - 1].group;
                if (!isFirstInGroup) return null;

                const groupTitles = voucherTitles.filter(
                  (v) => v.group === t.group
                );
                const groupUsedCount = groupTitles.reduce(
                  (total, v) =>
                    total +
                    (v.codigos
                      ? v.codigos.filter((c) => c.estado === "usado").length
                      : 0),
                  0
                );
                const groupCreatedCount = groupTitles.reduce(
                  (total, v) => total + (v.creados || 0),
                  0
                );
                const groupPercentage = calculatePercentage(
                  groupUsedCount,
                  groupCreatedCount
                );

                return (
                  <tr
                    key={t.group}
                    className="text-black border font-light h-10 border-black border-opacity-20"
                  >
                    <td className="w-3/12 font-light pl-4">{t.group}</td>
                    <td className="w-1/12 pl-4 font-light">
                      {formatearFecha(t.fecha)}
                    </td>
                    <td className="w-1/12 pl-4 font-light">
                      <div className="flex flex-row items-center gap-2">
                        <p>{groupUsedCount}</p>
                        <p
                          className={`flex flex-row rounded-full h-6 px-2 items-center text-gray-100 font-bold ${getUsageColor(groupUsedCount, groupCreatedCount)}`}
                        >
                          {groupPercentage}
                        </p>
                      </div>
                    </td>
                    <td className="w-1/12 pl-4 font-light">
                      {groupCreatedCount} / {groupCreatedCount}
                    </td>
                    <td className="w-1/12 pl-4 pr-4">
                      <NavLink
                        to={`/campañaDetalle/${t.titulo}`}
                        state={{ campaignData: t }}
                      >
                        <p className="text-5xl h-6 mb-10">...</p>
                      </NavLink>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={index}
                  className="text-black border font-light h-10 border-black border-opacity-20"
                >
                  <td className="w-3/12 font-light pl-4">{t.titulo}</td>
                  <td className="w-1/12 pl-4 font-light">
                    {formatearFecha(t.fecha)}
                  </td>
                  <td className="w-1/12 pl-4 font-light">
                    <div className="flex flex-row items-center gap-2">
                      <p className="">{usedCount}</p>
                      <p
                        className={`flex flex-row rounded-full h-6 px-2 items-center text-gray-100 font-bold ${getUsageColor(usedCount, t.usados)}`}
                      >
                        {percentage}
                      </p>
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
                  {isMarketingUser ? (
                    <td className="w-1/12 pl-4 pr-4">
                      <button
                        onClick={() => handleVoucherSelect(t.titulo)}
                        className="flex justify-end w-full"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-6 text-black"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.178.018.317.16.333.337l.526 5.784a.375.375 0 0 1-.374.409H7.232a.375.375 0 0 1-.374-.409l.526-5.784a.373.373 0 0 1 .333-.337 41.741 41.741 0 0 1 8.566 0Zm.967-3.97a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H18a.75.75 0 0 1-.75-.75V10.5ZM15 9.75a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V10.5a.75.75 0 0 0-.75-.75H15Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  ) : (
                    <NavLink
                      to={`/campañaDetalle/${t.titulo}`}
                      state={{ campaignData: t }}
                      className="w-1/12 pl-4 pr-4 h-6 flex items-center"
                    >
                      <p className="text-5xl h-6 mb-10">...</p>
                    </NavLink>
                  )}
                </tr>
              );
            })
          ) : (
            <></>
          )}
        </tbody>
      </table>

      <div className="flex justify-center items-center gap-8 pt-8 pb-8">
        <img src={arrow} className="h-2 rotate-180" alt="" />
        <p className="font-bold font-coolvetica text-xs">1</p>
        <img src={arrow} className="h-2" alt="" />
      </div>

      <VoucherModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setClickPositions([]);
        }}
        canvasRef={canvasRef}
        handleCanvasClick={handleCanvasClick}
        clickPositions={clickPositions}
        setClickPositions={setClickPositions}
        generateVoucherPDF={generateVoucherPDF}
        loading={loading}
        isMixedCampaign={isMixedCampaign}
      />
    </div>
  );
};

export default VoucherList;
