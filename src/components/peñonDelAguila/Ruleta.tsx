import React, { useState, useRef, useEffect } from "react";
import RuletaModal from "./RuletaModal";
import ConfiguracionRuletaModal from "./ConfiguracionRuletaModal";

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
    <div className="flex flex-col items-center">
      <style>
        {`
          .wheel-container {
            position: relative;
            width: 350px;
            height: 350px;
            margin: 20px auto;
            transform: rotate(180deg); /* Flip the entire wheel container */
          }
          .wheel {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #f5f5f5;
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
            background: #e0e0e0;
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
          .wheel-pointer {
            position: absolute;
            bottom: 130px; /* Changed from top to bottom */
            left: 50%;
            transform: translateX(-50%) rotate(180deg); /* Flip the pointer */
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 30px solid #333;
            z-index: 10;
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
            width: 350px;
            height: 175px; /* La mitad de la altura de la ruleta */
            background-color: #f1f1f1; /* Gray 100 */
            bottom: 0; /* Changed from top to bottom */
            left: 0;
            z-index: 5;
            pointer-events: none; /* Permite que los clics pasen a través del rectángulo */
          }
        `}
      </style>

      <div className="flex flex-row  items-center justify-center w-full max-w-md mt-8 ">
        <div className="flex space-x-2">
          <button
            className="config-button"
            onClick={() => setShowConfigModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path
                fillRule="evenodd"
                d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                clipRule="evenodd"
              />
            </svg>
            Configurar
          </button>
          <button
            className="button-spin"
            onClick={spinWheel}
            disabled={spinning || products.length === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-12v5h2V8h-2z" />
            </svg>
            {spinning ? "Girando..." : "Girar"}
          </button>
        </div>
      </div>
      {/* Información sobre la configuración actual */}
      <div className="mt-4 mb-12 text-sm text-gray-500 text-center">
        Sorteando entre {products.length} items.
      </div>

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
          <div className="wheel-pointer"></div>
          <div className="wheel" ref={wheelRef}>
            {products.map((product, index) => {
              const angle = (index * 360) / products.length;
              const backgroundColor = index % 2 === 0 ? "#f5f5f5" : "#e0e0e0";
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
