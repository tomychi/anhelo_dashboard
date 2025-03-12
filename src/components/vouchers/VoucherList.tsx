import React, { useState, useEffect, useRef } from "react";
import {
  actualizarVouchersUsados,
  obtenerTitulosVouchers,
  obtenerCodigosCampana,
  VoucherTituloConFecha,
} from "../../firebase/voucher";
import { jsPDF } from "jspdf";
import { projectAuth } from "../../firebase/config";
import voucherImg from "../../assets/Voucher2x1 x5.jpg";
import arrow from "../../assets/arrowIcon.png";
import { NavLink } from "react-router-dom";

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

const VoucherModal = ({
  isOpen,
  onClose,
  canvasRef,
  handleCanvasClick,
  clickPositions,
  generateVoucherPDF,
  loading,
  numCodes,
  setNumCodes,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    const image = new Image();
    image.src = voucherImg;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetWidth / (image.width / image.height);
      drawImage();
    };

    const drawImage = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      clickPositions.forEach((pos, index) => {
        drawClickPosition(ctx, pos, index + 1);
      });
    };

    const drawClickPosition = (ctx, pos, number) => {
      ctx.save();

      const rectWidth = 70;
      const rectHeight = 24;
      const borderRadius = 6;

      const centerX = pos.x;
      const centerY = pos.y;

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
      ctx.fillText(`Preview ${number}`, centerX, centerY);

      ctx.restore();
    };

    image.onload = () => {
      handleResize();
      window.addEventListener("resize", handleResize);
    };

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, clickPositions]);

  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleMouseDown = (e) => {
    setDragStart(e.clientY);
  };

  const handleTouchMove = (e) => {
    if (dragStart === null) return;
    const currentPosition = e.touches[0].clientY;
    const difference = currentPosition - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleMouseMove = (e) => {
    if (dragStart === null) return;
    const difference = e.clientY - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleDragEnd = () => {
    if (currentTranslate > 200) {
      onClose();
    } else {
      setCurrentTranslate(0);
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

  const handleNumCodesChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 10) {
      setNumCodes(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        style={{
          opacity: Math.max(0, 1 - currentTranslate / 400),
        }}
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className={`relative bg-white w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-12 transition-transform duration-300 touch-none ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          transform: `translateY(${currentTranslate}px)`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-gray-200 rounded-full" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-4">
            <input
              type="number"
              placeholder="Cantidad de codigos por voucher"
              onChange={handleNumCodesChange}
              className="w-full h-10 bg-gray-200 px-4 text-center font-coolvetica rounded-md"
            />
          </div>

          <div className="flex flex-row gap-4 items-center">
            <div className="w-3/5">
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg shadow-lg shadow-gray-300"
                onClick={handleCanvasClick}
              />
            </div>
            <div className="w-2/5">
              <h2 className="text-xs">
                {clickPositions.length < numCodes
                  ? `Haz clic en la imagen para elegir la ubicación del código ${
                      clickPositions.length + 1
                    } de ${numCodes}`
                  : "Todas las posiciones seleccionadas. Haz clic de nuevo para cambiarlas."}
              </h2>
              {clickPositions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-opacity-40 text-black">
                    Posiciones seleccionadas: {clickPositions.length}/{numCodes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={generateVoucherPDF}
            disabled={clickPositions.length !== numCodes || loading}
            className={`font-bold rounded-lg text-center h-20 mt-4 text-xl text-gray-100 ${
              clickPositions.length === numCodes
                ? "bg-black hover:bg-gray-800"
                : "bg-gray-400"
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
            ) : clickPositions.length === numCodes ? (
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
                <p className="text-2xl">Falta posicionar</p>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
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

        console.log("=== CAMPAÑAS AGRUPADAS ===", groupedCampaigns);
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

    setClickPositions((prev) => {
      if (prev.length >= numCodes) {
        return [{ x, y }];
      }
      return [...prev, { x, y }];
    });
  };

  const handleVoucherSelect = (titulo) => {
    setSelectedVoucher(titulo);
    setShowModal(true);
    setClickPositions([]);
  };

  const generateVoucherPDF = async () => {
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
          // Calculate the correct voucher number based on the group index
          const voucherNumber = Math.floor(i / numCodes) + 1;
          doc.text(`${voucherNumber}`, x + voucherWidth - 2, y + 3, {
            align: "right",
          });

          // Add each code at its corresponding position
          codesForThisVoucher.forEach((codigoData, index) => {
            if (index < clickPositions.length) {
              const position = clickPositions[index];
              const pdfX = position.x * pdfToCanvasScaleX;
              const pdfY = position.y * pdfToCanvasScaleY;

              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
              doc.text(`${codigoData.codigo}`, x + pdfX, y + pdfY, {
                align: "center",
                baseline: "middle",
              });
            }
          });

          voucherIndex++;
        }

        doc.save(`vouchers_${selectedVoucher}.pdf`);
      } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("Hubo un error al generar el PDF. Por favor, intente de nuevo.");
      } finally {
        setLoading(false);
      }
    } else {
      alert(
        "Por favor, seleccione un voucher y todas las posiciones de los códigos antes de generar el PDF."
      );
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
  const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

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
        generateVoucherPDF={generateVoucherPDF}
        loading={loading}
        numCodes={numCodes}
        setNumCodes={setNumCodes}
      />
    </div>
  );
};

export default VoucherList;
