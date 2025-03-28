import React, { useState, useRef, useEffect } from "react";
import arrow from "../../assets/arrowIcon.png";

// Fake DB de ejemplo (puede ser reemplazada por una DB real)
const fakeDB = [
  { id: 1, name: "Hamburguesa Clásica" },
  { id: 2, name: "Doble Cheese" },
  { id: 3, name: "Bacon Lover" },
  { id: 4, name: "Veggie Burger" },
  { id: 5, name: "Triple Impacto" },
  { id: 6, name: "Chicken BBQ" },
  { id: 7, name: "Spicy Jalapeño" },
  { id: 8, name: "Mega Combo" },
];

export const Ruleta: React.FC<{
  products?: { id: number; name: string }[];
}> = ({ products = fakeDB }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const wheelRef = useRef<HTMLDivElement>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
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

    const animate = (currentTime: number) => {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  const handlePageChange = (pageNumber: number) => {
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
            align-items: flex-start;
            justify-content: center;
            font-family: 'Coolvetica', sans-serif;
            font-size: 16px;
            color: #000;
            padding-top: 20px;
            pointer-events: none;
          }
          .wheel-pointer {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 30px solid #333;
            z-index: 10;
          }
          .result-display {
            margin-top: 20px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            font-family: 'Coolvetica', sans-serif;
            color: #333;
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
          Ruleta de Sorteo
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
                <span
                  style={{
                    transform: `rotate(-${angle}deg)`,
                    display: "inline-block",
                    maxWidth: "120px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {product.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {result && <div className="result-display">¡Ganaste: {result}!</div>}

      <div className="w-full max-w-md mt-4 px-4">
        <div
          ref={dropdownRef}
          className="relative flex items-center pr-2 w-full h-10 gap-1 rounded-lg border-4 border-[#333] font-coolvetica justify-between text-black text-xs font-light cursor-pointer"
          onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
        >
          <div className="flex flex-row items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 ml-1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>Historial de Resultados</p>
          </div>
          <img
            src={arrow}
            className={`h-2 arrow-down ${showHistoryDropdown ? "open" : ""}`}
            alt=""
          />
        </div>
      </div>

      {showHistoryDropdown && (
        <div className="font-coolvetica w-full max-w-md mx-4 mt-2 bg-white border-4 border-[#333] rounded-lg p-4">
          <table className="w-full text-xs text-left text-black">
            <thead className="text-black border-b h-10">
              <tr>
                <th scope="col" className="pl-4 w-1/2">
                  Producto
                </th>
                <th scope="col" className="pl-4 w-1/2">
                  Posición
                </th>
              </tr>
            </thead>
            <tbody>
              {currentHistory.map((product, index) => (
                <tr
                  key={index}
                  className="text-black border-b h-10 border-[#333] border-opacity-20"
                >
                  <td className="pl-4 font-light">{product}</td>
                  <td className="pl-4 font-light">
                    {indexOfFirstItem + index + 1}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination">
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={currentPage === number ? "active" : ""}
                >
                  {number}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Ruleta;
