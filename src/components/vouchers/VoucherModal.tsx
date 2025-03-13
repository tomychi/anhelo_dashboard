import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import voucherImg from "../../assets/voucher.png";

const VoucherModal = ({
  isOpen,
  onClose,
  canvasRef,
  clickPositions,
  setClickPositions,
  generateVoucherPDF,
  loading,
  isMixedCampaign = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  // Estado para la rotación actual
  const [currentRotation, setCurrentRotation] = useState(0);
  // Opciones de rotación disponibles
  const rotationOptions = [0, 90, 180, 270];

  // Total de posiciones necesarias
  const totalPositionsNeeded = isMixedCampaign ? 6 : 1;

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

      // Dibujar las posiciones y sus rotaciones
      clickPositions.forEach((pos, index) => {
        drawClickPosition(ctx, pos, index + 1, index === 0 && isMixedCampaign);
      });
    };

    const drawClickPosition = (ctx, pos, number, isGratis) => {
      ctx.save();

      const rectWidth = isGratis ? 90 : 70;
      const rectHeight = 24;
      const borderRadius = 6;

      const centerX = pos.x;
      const centerY = pos.y;

      // Rotación
      ctx.translate(centerX, centerY);
      ctx.rotate(((pos.rotation || 0) * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      const rectX = centerX - rectWidth / 2;
      const rectY = centerY - rectHeight / 2;

      // Dibuja el rectángulo redondeado
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

      // Color diferente para el preview
      ctx.fillStyle = isGratis
        ? "rgba(220, 53, 69, 0.8)"
        : "rgba(0, 0, 0, 0.8)";
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "medium 10px Coolvetica";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Texto diferente para el código gratis (solo en el preview)
      if (isGratis) {
        ctx.fillText(`Código GRATIS (${pos.rotation || 0}°)`, centerX, centerY);
      } else {
        ctx.fillText(
          `Código Normal ${number - 1} (${pos.rotation || 0}°)`,
          centerX,
          centerY
        );
      }

      ctx.restore();
    };

    image.onload = () => {
      handleResize();
      window.addEventListener("resize", handleResize);
    };

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, clickPositions, isMixedCampaign]);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Añadir posición con la rotación actual
    setClickPositions((prev) => {
      if (prev.length >= totalPositionsNeeded) {
        return [{ x, y, rotation: currentRotation }];
      }
      return [...prev, { x, y, rotation: currentRotation }];
    });
  };

  // Función para cambiar a la siguiente rotación
  const changeRotation = () => {
    const currentIndex = rotationOptions.indexOf(currentRotation);
    const nextIndex = (currentIndex + 1) % rotationOptions.length;
    setCurrentRotation(rotationOptions[nextIndex]);
  };

  // Actualizar la rotación de la posición actual
  const updateLastPositionRotation = () => {
    if (clickPositions.length === 0) return;

    setClickPositions((prev) => {
      const newPositions = [...prev];
      const lastPosition = newPositions[newPositions.length - 1];

      // Encontrar el siguiente valor de rotación
      const currentIndex = rotationOptions.indexOf(lastPosition.rotation || 0);
      const nextIndex = (currentIndex + 1) % rotationOptions.length;

      newPositions[newPositions.length - 1] = {
        ...lastPosition,
        rotation: rotationOptions[nextIndex],
      };

      return newPositions;
    });
  };

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

  // Determinar qué tipo de código se está posicionando actualmente
  const getCurrentCodeTypeText = () => {
    if (!isMixedCampaign) return "el código";

    if (clickPositions.length === 0) {
      return "el código GRATIS";
    } else {
      return `el código normal ${clickPositions.length}`;
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
          {isMixedCampaign && (
            <div className="mb-4 bg-gray-100 p-3 rounded-lg">
              <h3 className="text-sm font-bold">
                Campaña Mixta (Gratis + Normal)
              </h3>
              <p className="text-xs text-gray-600">
                Para cada voucher, debes posicionar 6 códigos: 1 código GRATIS y
                5 códigos NORMALES
              </p>
            </div>
          )}

          {/* Control de rotación actual */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Rotación actual:</span>
              <div className="bg-gray-200 px-3 py-1 rounded-lg text-sm font-bold">
                {currentRotation}°
              </div>
            </div>
            <button
              onClick={changeRotation}
              className="bg-black text-white px-4 py-2 text-sm rounded-lg"
            >
              Cambiar Rotación
            </button>

            {clickPositions.length > 0 && (
              <button
                onClick={updateLastPositionRotation}
                className="bg-gray-700 text-white px-4 py-2 text-sm rounded-lg ml-2"
              >
                Rotar Último Código
              </button>
            )}
          </div>

          <div className="flex flex-row gap-4 items-center">
            <div className="w-3/5">
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg shadow-lg shadow-gray-200 "
                onClick={handleCanvasClick}
              />
            </div>
            <div className="w-2/5">
              <h2 className="text-xs font-medium">
                {clickPositions.length < totalPositionsNeeded
                  ? `Haz clic en la imagen para elegir la ubicación de ${getCurrentCodeTypeText()} (${
                      clickPositions.length + 1
                    } de ${totalPositionsNeeded})`
                  : "Todas las posiciones seleccionadas. Haz clic de nuevo para reiniciar."}
              </h2>

              {isMixedCampaign && clickPositions.length > 0 && (
                <div className="mt-4 bg-gray-50 p-2 rounded-lg">
                  <p className="text-xs font-bold mb-2">
                    Posiciones seleccionadas:
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="inline-block px-2 py-1 text-xs rounded-full text-white bg-red-500">
                      Gratis: {Math.min(1, clickPositions.length)}/1
                    </span>
                    <span className="inline-block px-2 py-1 text-xs rounded-full text-white bg-gray-700">
                      Normales: {Math.max(0, clickPositions.length - 1)}/5
                    </span>
                  </div>
                </div>
              )}

              {clickPositions.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium">
                    Rotaciones configuradas:
                  </p>
                  <div className="mt-1 max-h-32 overflow-y-auto">
                    {clickPositions.map((pos, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex justify-between items-center py-1 border-b border-gray-100"
                      >
                        <span>
                          {idx === 0 && isMixedCampaign
                            ? "Código GRATIS"
                            : `Código ${isMixedCampaign ? "Normal " + idx : idx + 1}`}
                        </span>
                        <span className="font-bold">{pos.rotation || 0}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={generateVoucherPDF}
            disabled={clickPositions.length !== totalPositionsNeeded || loading}
            className={`font-bold rounded-lg text-center h-20 mt-4 text-xl text-gray-100 ${
              clickPositions.length === totalPositionsNeeded
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
            ) : clickPositions.length === totalPositionsNeeded ? (
              "Generar PDF"
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
                <p className="text-2xl">
                  Falta posicionar{" "}
                  {totalPositionsNeeded - clickPositions.length} códigos
                </p>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherModal;
