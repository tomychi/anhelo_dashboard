import React, { useState, useRef, useEffect } from "react";
import RuletaModal from "./RuletaModal";
import ConfiguracionRuletaModal from "./ConfiguracionRuletaModal";
import logo from "../../assets/AGUILA BLANCO-1.png";
import arrowIcon from "../../assets/arrowIcon.png";
import LoadingPoints from "../LoadingPoints";

// Función para generar productos a partir de los números seleccionados
const generateProducts = (selectedNumbers) => {
  return selectedNumbers.map((number) => ({
    id: number,
    name: `${number}`,
  }));
};

export const Ruleta = () => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState(
    Array.from({ length: 30 }, (_, i) => i + 1)
  );
  const [products, setProducts] = useState(generateProducts(selectedNumbers));

  const wheelRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentRotationRef = useRef(0);

  // Actualizar productos cuando cambian los números seleccionados
  useEffect(() => {
    setProducts(generateProducts(selectedNumbers));
  }, [selectedNumbers]);

  const spinWheel = () => {
    if (spinning || !wheelRef.current || products.length === 0) return;

    setSpinning(true);
    setResult(null);

    const degreesPerItem = 360 / products.length;
    let currentRotation = currentRotationRef.current;
    let speed = 20; // Velocidad inicial
    const baseDuration = 5000; // 5 segundos base
    const extraDuration = Math.random() * 5000; // Hasta 5 segundos adicionales
    const spinDuration = baseDuration + extraDuration; // Entre 5 y 10 segundos
    const startTime = performance.now();

    const animate = (currentTime) => {
      if (!wheelRef.current) return;

      const elapsedTime = currentTime - startTime;
      const progress = elapsedTime / spinDuration; // Progreso de 0 a 1

      // Desaceleración suave basada en el tiempo restante
      const remainingTime = spinDuration - elapsedTime;
      speed = Math.max(20 * (remainingTime / spinDuration), 0.1); // Velocidad disminuye linealmente

      currentRotation += speed;
      wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;

      if (elapsedTime < spinDuration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Alinear al segmento más cercano sin transición CSS
        const finalRotation =
          Math.round(currentRotation / degreesPerItem) * degreesPerItem;
        let adjustmentSpeed = speed;
        const adjustmentStep = () => {
          if (!wheelRef.current) return;

          if (Math.abs(currentRotation - finalRotation) > adjustmentSpeed) {
            currentRotation +=
              currentRotation < finalRotation
                ? adjustmentSpeed
                : -adjustmentSpeed;
            wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
            animationFrameRef.current = requestAnimationFrame(adjustmentStep);
          } else {
            currentRotation = finalRotation;
            wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
            setSpinning(false);

            const normalizedRotation = finalRotation % 360;
            const winningIndex =
              Math.floor((360 - normalizedRotation) / degreesPerItem) %
              products.length;
            const winningProduct = products[winningIndex].name;
            setResult(winningProduct);
            currentRotationRef.current = finalRotation;

            // Mostrar el modal con el resultado
            setShowResultModal(true);
          }
        };

        animationFrameRef.current = requestAnimationFrame(adjustmentStep);
      }
    };

    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Manejar configuración guardada
  const handleSaveConfig = (newSelectedNumbers) => {
    setSelectedNumbers(newSelectedNumbers);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <style>
        {`
          .wheel-container {
            position: relative;
            width: 560px;
            height: 560px;
            margin: 20px auto;
            transform: rotate(180deg); /* Flip the entire wheel container */
          }
          .wheel {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #F3F4F6;
            border: 4px solid #333;
            overflow: hidden;
          }
          .wheel-segment {
            position: absolute;
            width: 50%;
            height: 50%;
            top: 50%;
            left: 50%;
            transform-origin: 0% 0%;
            background: #F3F4F6;
          }
          .wheel-label {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Coolvetica', sans-serif;
            font-size: 16px;
            color: #000;
            pointer-events: none;
            transform: rotate(180deg); /* Flip the labels back so they're readable */
          }
          .label-text {
            position: absolute;
            width: 120px;
            bottom: 10px; /* Changed from top to bottom */
            right: calc(50% + 10px); /* Changed from left to right */
            max-width: 120px;
            text-align: right; /* Align text to the right */
          }
          
          .button-spin {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            font-family: 'Coolvetica', sans-serif;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .button-spin:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }
          .config-button {
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            font-family: 'Coolvetica', sans-serif;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .gray-overlay {
            position: absolute;
            width: 560px;
            height: 280px; /* La mitad de la altura de la ruleta */
            background-color: #F3F4F6; /* Gray 100 */
            bottom: 0; /* Changed from top to bottom */
            left: 0;
            z-index: 5;
            pointer-events: none; /* Permite que los clics pasen a través del rectángulo */
          }
        `}
      </style>

      <div className="flex flex-col gap-8 z-50 items-center justify-center w-full max-w-md  ">
        <img src={logo} className="h-12" />
        <div className="flex flex-row">
          <div className="flex space-x-2">
            <button
              className="h-10 flex flex-row items-center bg-gray-200 rounded-full px-4 font-bold font-coolvetica gap-2 text-xl"
              onClick={() => setShowConfigModal(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6"
              >
                <path d="M18.75 12.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM12 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 6ZM12 18a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 18ZM3.75 6.75h1.5a.75.75 0 1 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM5.25 18.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5ZM3 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3 12ZM9 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM12.75 12a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM9 15.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
              </svg>
              Configurar
            </button>
            <button
              className="h-10 items-center bg-gray-200 rounded-full px-4 font-bold font-coolvetica "
              onClick={spinWheel}
              disabled={spinning || products.length === 0}
            >
              {spinning ? (
                <LoadingPoints />
              ) : (
                <div className="flex flex-row gap-2 text-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6"
                  >
                    <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 12.75v9h6.75a2.25 2.25 0 0 0 2.25-2.25v-6.75h-9Z" />
                  </svg>
                  <p>Sortear</p>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Información sobre la configuración actual */}
      <div className="mt-4 mb-12 font-coolvetica  text-sm text-gray-400 font-light z-50 text-center">
        {products.length} participantes.
      </div>

      <img src={arrowIcon} className="h-6 z-50 transform rotate-90" alt="" />

      {/* Ruleta */}
      <div className="mt-[-350px]">
        {products.length === 0 ? (
          <div className="my-20 text-center">
            <p className="text-gray-400 text-xl">
              No hay elementos configurados.
            </p>
            <p className="text-gray-400">
              Haz clic en "Configurar" para añadir elementos a la ruleta.
            </p>
          </div>
        ) : (
          <div className="wheel-container">
            <div className="wheel" ref={wheelRef}>
              {products.map((product, index) => {
                const angle = (index * 360) / products.length;
                const backgroundColor = "#F3F4F6";
                return (
                  <div
                    key={product.id}
                    className="wheel-segment"
                    style={{
                      transform: `rotate(${angle}deg) skewY(${90 - 360 / products.length}deg)`,
                      backgroundColor,
                    }}
                  />
                );
              })}
              {products.map((product, index) => {
                const angle = (index * 360) / products.length;
                return (
                  <div
                    key={product.id}
                    className="wheel-label"
                    style={{
                      transform: `rotate(${angle + 180}deg)` /* Added 180 to adjust for the container flip */,
                    }}
                  >
                    <div className="label-text ">{product.name}</div>
                  </div>
                );
              })}
            </div>
            {/* Rectángulo gris que cubre la mitad inferior de la ruleta (ahora) */}
            <div className="gray-overlay"></div>
          </div>
        )}
      </div>

      {/* Modal para mostrar el resultado */}
      <RuletaModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="¡Felicitaciones!"
        winningPrize={result}
      />

      {/* Modal para configurar la ruleta */}
      <ConfiguracionRuletaModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSaveConfig={handleSaveConfig}
        initialItems={selectedNumbers}
      />
    </div>
  );
};

export default Ruleta;
