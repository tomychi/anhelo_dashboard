import React, { useState, useRef, useEffect } from "react";
import RuletaModal from "./RuletaModal";

// Fake DB de ejemplo (puede ser reemplazada por una DB real)
const fakeDB = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  name: `${index + 1}`,
}));

export const Ruleta = ({ products = fakeDB }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showResultModal, setShowResultModal] = useState(false);
  const itemsPerPage = 5;
  const wheelRef = useRef(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentRotationRef = useRef(0);

  const spinWheel = () => {
    if (spinning || !wheelRef.current) return;

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
            setHistory((prev) => [winningProduct, ...prev].slice(0, 20));
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowHistoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistory = history.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col items-center">
      <style>
        {`
          .wheel-container {
            position: relative;
            width: 350px;
            height: 350px;
            margin: 20px auto;
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
          }
          .label-text {
            position: absolute;
            width: 120px;
            top: 10px;
            left: calc(50% + 10px);
            max-width: 120px;
          }
          .wheel-pointer {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
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
          .arrow-down {
            transition: transform 0.3s ease;
            transform: rotate(90deg);
          }
          .arrow-down.open {
            transform: rotate(-90deg);
          }
          .pagination {
            display: flex;
            justify-content: center;
            gap: 5px;
            margin-top: 10px;
          }
          .pagination button {
            padding: 5px 10px;
            border: 1px solid #ddd;
            background: transparent;
            cursor: pointer;
          }
          .pagination button.active {
            background-color: #333;
            color: white;
          }
        `}
      </style>

      <div className="flex flex-row justify-between items-center w-full max-w-md mt-8 mb-4 px-4">
        <p className="text-black font-bold text-2xl font-coolvetica">
          Regalos legendarios
        </p>
        <button className="button-spin" onClick={spinWheel} disabled={spinning}>
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
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div className="label-text ">{product.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal personalizado para mostrar el resultado */}
      <RuletaModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="¡Felicitaciones!"
        winningPrize={result}
      />
    </div>
  );
};

export default Ruleta;
