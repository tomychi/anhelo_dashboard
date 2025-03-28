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
    let speed = 30; // Velocidad inicial aumentada para efecto más épico
    const baseDuration = 5000; // 5 segundos base
    const extraDuration = Math.random() * 7000; // Hasta 7 segundos adicionales para mayor expectación
    const spinDuration = baseDuration + extraDuration; // Entre 5 y 12 segundos
    const startTime = performance.now();

    // Efectos de sonido para la experiencia épica
    // Puedes agregar aquí código para reproducir sonidos

    const animate = (currentTime) => {
      if (!wheelRef.current) return;

      const elapsedTime = currentTime - startTime;
      const progress = elapsedTime / spinDuration; // Progreso de 0 a 1

      // Desaceleración suave basada en el tiempo restante
      const remainingTime = spinDuration - elapsedTime;
      speed = Math.max(30 * (remainingTime / spinDuration), 0.1); // Velocidad disminuye linealmente

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
    <div className="flex flex-col items-center w-full">
      <style>
        {`
          @keyframes glow {
            0% { box-shadow: 0 0 20px 5px rgba(255, 215, 0, 0.5); }
            50% { box-shadow: 0 0 40px 15px rgba(255, 215, 0, 0.7); }
            100% { box-shadow: 0 0 20px 5px rgba(255, 215, 0, 0.5); }
          }

          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          .wheel-container {
            position: relative;
            width: 75vw;
            height: 37.5vw; /* Mitad de la altura para mostrar solo semicírculo superior */
            max-width: 900px;
            max-height: 450px; /* Mitad de la altura máxima */
            margin: 20px auto;
            overflow: hidden; /* Oculta la parte inferior */
          }
          
          .wheel {
            position: absolute;
            width: 100%;
            height: 200%; /* El doble de la altura para que se vea completo el círculo */
            border-radius: 50%;
            background: #f5f5f5;
            border: 10px solid #333;
            overflow: hidden;
            transition: transform 0.3s ease;
            box-shadow: 0 0 30px 10px rgba(0, 0, 0, 0.3);
            animation: ${spinning ? "glow 2s infinite" : "none"};
            bottom: 0; /* Alinea la parte inferior del círculo con el contenedor */
          }
          
          .wheel-segment {
            position: absolute;
            width: 50%;
            height: 50%;
            top: 50%;
            left: 50%;
            transform-origin: 0% 0%;
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
            font-size: calc(14px + 1vw);
            font-weight: bold;
            color: #000;
            pointer-events: none;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .label-text {
            position: absolute;
            width: 40%;
            top: 15%;
            left: calc(50% + 20px);
            text-align: center;
            font-size: calc(16px + 1.5vw);
            font-weight: bold;
          }
          
          .wheel-pointer {
            position: absolute;
            top: -15px; /* Ajustado para que se vea mejor */
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 30px solid transparent;
            border-right: 30px solid transparent;
            border-top: 60px solid #cc0000;
            z-index: 10;
            filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
          }
          
          .button-spin {
            background: linear-gradient(45deg, #ff4e50, #f9d423);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-family: 'Coolvetica', sans-serif;
            font-size: calc(16px + 0.5vw);
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            animation: ${!spinning ? "pulse 2s infinite" : "none"};
          }
          
          .button-spin:hover {
            transform: translateY(-5px);
            box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
          }
          
          .button-spin:disabled {
            background: linear-gradient(45deg, #cccccc, #999999);
            cursor: not-allowed;
            animation: none;
          }
          
          .config-button {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-family: 'Coolvetica', sans-serif;
            font-size: calc(16px + 0.5vw);
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
          }
          
          .config-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
          }
          
          .info-text {
            font-size: calc(14px + 0.5vw);
            font-weight: bold;
            color: #555;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .empty-message {
            font-size: calc(20px + 1vw);
            color: #888;
            text-align: center;
            margin: 50px 0;
          }
        `}
      </style>

      <div className="flex flex-row items-center justify-center w-full max-w-4xl mx-auto mt-8 mb-4 space-x-6">
        <button
          className="config-button"
          onClick={() => setShowConfigModal(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
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
            className="h-6 w-6"
          >
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-12v5h2V8h-2z" />
          </svg>
          {spinning ? "¡GIRANDO!" : "¡GIRAR!"}
        </button>
      </div>

      {/* Información sobre la configuración actual */}
      <div className="mb-8 info-text">
        Sorteando entre <span className="text-blue-600">{products.length}</span>{" "}
        items.
      </div>

      {products.length === 0 ? (
        <div className="my-20 text-center empty-message">
          <p>No hay elementos configurados.</p>
          <p className="mt-4 text-base">
            Haz clic en "Configurar" para añadir elementos a la ruleta.
          </p>
        </div>
      ) : (
        <div className="wheel-container">
          <div className="wheel-pointer"></div>
          <div className="wheel" ref={wheelRef}>
            {products.map((product, index) => {
              const angle = (index * 360) / products.length;
              // Colores alternados más vibrantes para efecto visual mejorado
              const colors = [
                "#FF5757",
                "#5271FF",
                "#38B6FF",
                "#8C52FF",
                "#FFC857",
                "#66D2D6",
                "#FF9956",
                "#5CE1E6",
              ];
              const backgroundColor = colors[index % colors.length];
              return (
                <div
                  key={product.id}
                  className="wheel-segment"
                  style={{
                    transform: `rotate(${angle}deg) skewY(${
                      90 - 360 / products.length
                    }deg)`,
                    backgroundColor,
                  }}
                />
              );
            })}
            {products.map((product, index) => {
              const angle = (index * 360) / products.length;
              // Solo mostrar etiquetas en la mitad superior (ángulos entre 0° y 180°)
              const isInUpperHalf = angle >= 0 && angle <= 180;
              const adjustedAngle = (angle + 180) % 360; // Ajustado para mejor legibilidad
              const textRotation =
                adjustedAngle > 90 && adjustedAngle < 270 ? 180 : 0;

              return (
                <div
                  key={product.id}
                  className="wheel-label"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    display: isInUpperHalf ? "block" : "none",
                  }}
                >
                  <div
                    className="label-text"
                    style={{
                      transform: `rotate(${textRotation}deg)`,
                    }}
                  >
                    {product.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para mostrar el resultado */}
      <RuletaModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="¡GANADOR!"
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
