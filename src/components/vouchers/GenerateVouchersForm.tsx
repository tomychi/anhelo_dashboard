import { useState, useEffect, useRef } from "react";
import { crearVoucher } from "../../firebase/voucher";
import VoucherList from "./VoucherList";
import { crearVoucherMixto } from "../../firebase/voucher"; // Importamos la nueva función

// Componente Toggle reutilizable
const Toggle = ({ isOn, onToggle }) => (
  <div
    className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer ${
      isOn ? "bg-black" : "bg-gray-200"
    }`}
    onClick={onToggle}
  >
    <div
      className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
        isOn ? "translate-x-6" : ""
      }`}
    />
  </div>
);

export const GenerateVouchersForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [cantidad, setCantidad] = useState(0);
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [esGratis, setEsGratis] = useState(false);

  // Nuevos estados para la funcionalidad mixta
  const [esMixto, setEsMixto] = useState(false);
  const [cantidadGratis, setCantidadGratis] = useState(0);
  const [cantidadNormales, setCantidadNormales] = useState(0);

  // Modal drag states
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  useEffect(() => {
    if (showForm) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [showForm]);

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
      handleCloseForm();
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

  const handleCreateVoucher = async () => {
    setLoading(true);
    try {
      if (esMixto) {
        // Si es una campaña mixta, usamos la nueva función
        if (cantidadGratis <= 0 || cantidadNormales <= 0) {
          throw new Error("Ambas cantidades deben ser mayores a cero");
        }
        await crearVoucherMixto(
          titulo,
          fecha,
          cantidadGratis,
          cantidadNormales
        );
      } else {
        // Si no es mixta, usamos la función original
        await crearVoucher(titulo, fecha, cantidad, esGratis);
      }
      alert("Voucher creado exitosamente");
      handleCloseForm();
    } catch (error) {
      alert(`Error al crear el voucher: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTitulo("");
    setFecha("");
    setCantidad(0);
    setEsGratis(false);
    setEsMixto(false);
    setCantidadGratis(0);
    setCantidadNormales(0);
    setCurrentTranslate(0);
    setIsAnimating(false);
  };

  return (
    <>
      <style>
        {`
        input[type="date"]::-webkit-calendar-picker-indicator {
						filter: invert(100%);
        }
    `}
      </style>

      <div className="flex flex-col">
        <div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 pb-8">
          <p className="text-black font-bold text-4xl mt-1">Vouchers</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-200 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-bold">Nueva campaña</p>
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
            <div
              className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
                isAnimating ? "bg-opacity-50" : "bg-opacity-0"
              }`}
              style={{
                opacity: Math.max(0, 1 - currentTranslate / 400),
              }}
              onClick={handleCloseForm}
            />

            <div
              ref={modalRef}
              className={`relative bg-white w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-10 transition-transform duration-300 touch-none ${
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

              <div className="mt-4 flex-col space-y-2 w-full">
                <input
                  type="text"
                  placeholder="Título de la nueva campaña"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
                />
                <input
                  type="date"
                  placeholder="Fecha del voucher"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
                />

                {/* Toggle para tipo de campaña */}
                <div className="flex flex-row items-center justify-between gap-2 pt-2">
                  <p className="font-bold text-sm">
                    Campaña mixta (gratis + normal)
                  </p>
                  <Toggle
                    isOn={esMixto}
                    onToggle={() => {
                      setEsMixto(!esMixto);
                      // Reiniciar el otro toggle si cambiamos de modo
                      if (!esMixto) {
                        setEsGratis(false);
                      }
                    }}
                  />
                </div>

                {esMixto ? (
                  // Campos para campaña mixta
                  <>
                    <input
                      type="number"
                      placeholder="Cantidad de códigos GRATIS"
                      value={cantidadGratis || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCantidadGratis(
                          value === "" ? 0 : parseInt(value, 10)
                        );
                      }}
                      className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
                    />
                    <input
                      type="number"
                      placeholder="Cantidad de códigos NORMALES"
                      value={cantidadNormales || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCantidadNormales(
                          value === "" ? 0 : parseInt(value, 10)
                        );
                      }}
                      className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
                    />
                    <div className="p-2 bg-gray-100 rounded-md mt-2">
                      <p className="text-xs font-bold">
                        Total: {cantidadGratis + cantidadNormales} códigos
                      </p>
                      <p className="text-xs text-gray-600">
                        Crearás {cantidadGratis} códigos gratis y{" "}
                        {cantidadNormales} códigos normales
                      </p>
                    </div>
                  </>
                ) : (
                  // Campos para campaña regular
                  <>
                    <input
                      type="number"
                      placeholder="Cantidad de códigos a generar"
                      value={cantidad || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCantidad(value === "" ? 0 : parseInt(value, 10));
                      }}
                      className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
                    />

                    {/* Toggle para Gratis (solo visible si no es mixto) */}
                    <div className="flex flex-row items-center justify-between gap-2 pt-2">
                      <p className="font-bold text-sm">Todos son gratis</p>
                      <Toggle
                        isOn={esGratis}
                        onToggle={() => setEsGratis(!esGratis)}
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleCreateVoucher}
                disabled={
                  loading ||
                  titulo === "" ||
                  fecha === "" ||
                  (esMixto
                    ? cantidadGratis <= 0 || cantidadNormales <= 0
                    : cantidad <= 0)
                }
                className={`text-gray-100 w-full mt-4 text-4xl h-20 px-4 ${
                  loading ||
                  titulo === "" ||
                  fecha === "" ||
                  (esMixto
                    ? cantidadGratis <= 0 || cantidadNormales <= 0
                    : cantidad <= 0)
                    ? "bg-gray-400"
                    : "bg-black"
                } font-bold rounded-lg outline-none`}
              >
                {loading ? (
                  <div className="flex justify-center w-full items-center">
                    <div className="flex flex-row gap-1">
                      <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                ) : (
                  "Crear"
                )}
              </button>
            </div>
          </div>
        )}

        <VoucherList />
      </div>
    </>
  );
};

export default GenerateVouchersForm;
