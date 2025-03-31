import { useState, useEffect, useRef } from "react";
import SalesCards from "./SalesCards";
import LoadingPoints from "../LoadingPoints";
import { guardarFacturaPorMonto } from "../../firebase/afip";
import currencyFormat from "../../helpers/currencyFormat";

// URL del backend en AWS EC2
const BASE_URL = "https://backend.onlyanhelo.com";

const FacturarPorMonto = ({ onClose, tokenStatus, visible }) => {
  // Estados para el formulario
  const [formData, setFormData] = useState({
    montoTotal: "",
    cantidadFacturas: "",
    montoMinimo: "",
    montoMaximo: "",
    cuit: "33718835289",
    puntoVenta: "2",
    tipoFactura: "B",
  });
  const [ventasGeneradas, setVentasGeneradas] = useState([]);
  const [error, setError] = useState(null);
  const [respuesta, setRespuesta] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para el modal drag
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  // Efecto para inicializar animación cuando el modal se hace visible
  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [visible]);

  // Manejadores de drag para el modal
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
      handleCloseModal();
    } else {
      setCurrentTranslate(0);
    }
    setDragStart(null);
  };

  const handleCloseModal = () => {
    setIsAnimating(false);
    // Damos un poco de tiempo para que la animación termine antes de cerrar completamente
    setTimeout(() => {
      onClose(); // Esta llamada invocará a handleCloseFacturarPorMonto en el componente padre
    }, 300);
  };

  // Listeners para los eventos del drag
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

  // Función para generar ventas aleatorias
  const generarVentas = () => {
    setError(null);
    setIsGenerating(true);

    try {
      const montoTotal = parseInt(formData.montoTotal.replace(/\D/g, ""));
      const cantidadFacturas = parseInt(formData.cantidadFacturas);
      const montoMinimo = parseInt(formData.montoMinimo.replace(/\D/g, ""));
      const montoMaximo = parseInt(formData.montoMaximo.replace(/\D/g, ""));

      // Validaciones
      if (isNaN(montoTotal) || montoTotal <= 0) {
        throw new Error("El monto total debe ser un número mayor a 0");
      }
      if (isNaN(cantidadFacturas) || cantidadFacturas <= 0) {
        throw new Error("La cantidad de facturas debe ser un número mayor a 0");
      }
      if (isNaN(montoMinimo) || montoMinimo <= 0) {
        throw new Error("El monto mínimo debe ser un número mayor a 0");
      }
      if (isNaN(montoMaximo) || montoMaximo <= montoMinimo) {
        throw new Error("El monto máximo debe ser mayor al monto mínimo");
      }
      if (montoMinimo * cantidadFacturas > montoTotal) {
        throw new Error(
          `El monto mínimo por la cantidad de facturas (${currencyFormat(montoMinimo * cantidadFacturas)}) supera el monto total a facturar`
        );
      }
      if (montoMaximo * cantidadFacturas < montoTotal) {
        throw new Error(
          `El monto total no se puede distribuir en ${cantidadFacturas} facturas con el máximo establecido. Aumente el máximo o reduzca la cantidad de facturas.`
        );
      }

      // Algoritmo para distribuir montos aleatorios que sumen exactamente el total
      let montos = [];
      let montoRestante = montoTotal;
      let facturasRestantes = cantidadFacturas;

      // Generamos montos aleatorios hasta la penúltima factura
      for (let i = 0; i < cantidadFacturas - 1; i++) {
        // Calculamos los límites dinámicos para esta factura
        const minimoAjustado = Math.max(
          montoMinimo,
          montoRestante - (facturasRestantes - 1) * montoMaximo
        );
        const maximoAjustado = Math.min(
          montoMaximo,
          montoRestante - (facturasRestantes - 1) * montoMinimo
        );

        // Generamos un monto aleatorio dentro de los límites ajustados
        // Usamos números enteros para que sean montos redondeados
        const monto = Math.floor(
          minimoAjustado + Math.random() * (maximoAjustado - minimoAjustado)
        );

        montos.push(monto);
        montoRestante -= monto;
        facturasRestantes--;
      }

      // La última factura toma el monto restante
      montos.push(montoRestante);

      // Verificación final
      const sumaTotal = montos.reduce((sum, monto) => sum + monto, 0);
      if (sumaTotal !== montoTotal) {
        throw new Error(
          "Error en la generación de montos. La suma no coincide con el total"
        );
      }

      // Creamos las ventas
      const fechaActual = new Date();
      const ventas = montos.map((monto, index) => {
        // Generamos una ID única y fecha/hora
        const id = `generated-${fechaActual.getTime()}-${index}`;
        const fecha = fechaActual.toLocaleDateString();
        const hora = fechaActual.toLocaleTimeString();

        return {
          id,
          fecha,
          hora,
          importeTotal: monto.toString(),
          importeNeto: (monto / 1.21).toFixed(2),
          importeTrib: "0.00",
          quiereFacturarla: true,
        };
      });

      setVentasGeneradas(ventas);
    } catch (error) {
      setError(error.message);
      setVentasGeneradas([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Manejador para cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si es un campo numérico, formateamos para mostrar separadores de miles
    if (["montoTotal", "montoMinimo", "montoMaximo"].includes(name)) {
      // Eliminar todo excepto dígitos
      const numericValue = value.replace(/\D/g, "");

      // Formatear con separadores de miles
      const formattedValue =
        numericValue === ""
          ? ""
          : new Intl.NumberFormat("es-AR").format(numericValue);

      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Función para enviar las facturas
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRespuesta(null);
    setIsSubmitting(true);

    try {
      const ventasAFacturar = ventasGeneradas.filter(
        (venta) => venta.quiereFacturarla
      );

      if (ventasAFacturar.length === 0) {
        throw new Error("No hay ventas seleccionadas para facturar");
      }

      // Array para almacenar todas las respuestas
      const todasLasRespuestas = [];

      // Procesar las facturas una por una
      for (let i = 0; i < ventasAFacturar.length; i++) {
        const venta = ventasAFacturar[i];

        // Datos de facturación para cada venta
        const facturaData = {
          cuit: formData.cuit,
          puntoVenta: formData.puntoVenta,
          tipoComprobante: formData.tipoFactura, // Nota el cambio de tipoFactura a tipoComprobante
          importeNeto: venta.importeNeto,
          importeTrib: venta.importeTrib,
          importeTotal: venta.importeTotal,
          documentoReceptor: 99, // Consumidor final
          numeroReceptor: 0, // Consumidor final
        };

        try {
          // Enviar solicitud para una sola factura
          const response = await fetch(`${BASE_URL}/api/afip/factura`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cuit: facturaData.cuit,
              puntoVenta: facturaData.puntoVenta,
              tipoFactura: facturaData.tipoComprobante, // Para mantener compatibilidad con la API
              importeNeto: facturaData.importeNeto,
              importeTrib: facturaData.importeTrib,
              importeTotal: facturaData.importeTotal,
            }),
          });

          const data = await response.json();
          console.log(`Respuesta de factura ${i + 1}:`, data);

          // Preparar la respuesta para mostrar al usuario
          let respuestaFactura;

          if (response.ok && data.success && data.data.resultado === "A") {
            // Factura generada con éxito
            respuestaFactura = {
              cae: data.data.cae,
              caeFchVto: data.data.caeFchVto,
              cbteDesde: data.data.cbteDesde,
              cbteHasta: data.data.cbteHasta,
            };

            // Crear datos completos para guardar en Firebase
            const facturaParaGuardar = {
              ...facturaData,
              cae: data.data.cae,
              caeFchVto: data.data.caeFchVto,
              numeroComprobante: data.data.cbteDesde,
            };

            // Guardar la factura en la nueva colección
            const guardadoExitoso =
              await guardarFacturaPorMonto(facturaParaGuardar);

            if (!guardadoExitoso) {
              console.warn(
                `Factura ${i + 1} emitida con éxito pero no se pudo guardar en Firebase`
              );
            } else {
              console.log(
                `Factura ${i + 1} emitida y guardada con éxito. CAE: ${data.data.cae}`
              );
            }
          } else {
            // Error al generar la factura
            const errorMsg =
              data.errorDetails ||
              (Array.isArray(data.data?.errores)
                ? data.data.errores.map((err) => err.Msg).join(", ")
                : data.data?.errores?.Msg ||
                  data.data?.observaciones?.Msg ||
                  data.message ||
                  "Error desconocido");

            respuestaFactura = {
              error: errorMsg,
              cae: "No generado",
            };

            console.log(`Error al procesar factura ${i + 1}: ${errorMsg}`);
          }

          // Agregar esta respuesta al array de todas las respuestas
          todasLasRespuestas.push(respuestaFactura);
        } catch (error) {
          // Error de red o en la solicitud
          console.error(`Error al procesar factura ${i + 1}:`, error);
          todasLasRespuestas.push({
            error: error.message || "Error de conexión con el servidor",
            cae: "No generado",
          });
        }
      }

      // Mostrar todas las respuestas al usuario
      setRespuesta(todasLasRespuestas);

      // Determinar si hubo algún error
      const facturasFallidas = todasLasRespuestas.filter(
        (f) => f.error || !f.cae || f.cae === "No generado"
      );

      if (
        facturasFallidas.length > 0 &&
        facturasFallidas.length === todasLasRespuestas.length
      ) {
        setError("No se generó ninguna factura correctamente");
      } else if (facturasFallidas.length > 0) {
        setError("Algunas facturas no se generaron correctamente");
      }
    } catch (error) {
      setError(error.message || "Error general en el proceso de facturación");
      console.error("Error en handleSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Función para manejar el toggle de facturar
  const handleToggleFacturar = (ventaId) => {
    setVentasGeneradas((prevVentas) =>
      prevVentas.map((venta) =>
        venta.id === ventaId
          ? { ...venta, quiereFacturarla: !venta.quiereFacturarla }
          : venta
      )
    );
  };

  // Función para copiar resultados al portapapeles
  const copyResultsToClipboard = () => {
    if (!respuesta) return;

    let textToCopy = "";
    if (Array.isArray(respuesta)) {
      textToCopy = respuesta
        .map((resp, index) => {
          return (
            `FACTURA ${index + 1}:\n` +
            (resp.cae
              ? `CAE: ${resp.cae}\nVencimiento: ${resp.caeFchVto || "N/A"}\nComprobante número: ${resp.cbteDesde}\n`
              : `Error: ${resp.error || "No generado"}\n`) +
            "------------------------\n"
          );
        })
        .join("\n");
    }

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        // Mostrar una notificación temporal
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.bottom = "20px";
        notification.style.padding = "0 20px";
        notification.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        notification.style.color = "white";
        notification.style.borderRadius = "9999px";
        notification.style.left = "0";
        notification.style.right = "0";
        notification.style.marginLeft = "1rem";
        notification.style.marginRight = "1rem";
        notification.style.width = "calc(100% - 2rem)";
        notification.style.height = "40px";
        notification.style.zIndex = "1000";
        notification.style.textAlign = "center";
        notification.style.fontFamily = "Coolvetica, sans-serif";
        notification.style.fontWeight = "bold";
        notification.style.backdropFilter = "blur(8px)";
        notification.style.WebkitBackdropFilter = "blur(8px)";
        notification.style.display = "flex";
        notification.style.alignItems = "center";
        notification.style.justifyContent = "center";
        notification.style.gap = "8px";

        // Crear el SVG
        const svgIcon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        svgIcon.setAttribute("viewBox", "0 0 24 24");
        svgIcon.setAttribute("fill", "currentColor");
        svgIcon.style.width = "24px";
        svgIcon.style.height = "24px";
        svgIcon.style.flexShrink = "0";

        // Crear el path dentro del SVG
        const svgPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        svgPath.setAttribute("fill-rule", "evenodd");
        svgPath.setAttribute("clip-rule", "evenodd");
        svgPath.setAttribute(
          "d",
          "M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
        );

        // Añadir el path al SVG
        svgIcon.appendChild(svgPath);

        // Crear un span para el texto
        const textSpan = document.createElement("span");
        textSpan.textContent = "Resultados copiados al portapapeles";

        // Añadir el SVG y el texto a la notificación
        notification.appendChild(svgIcon);
        notification.appendChild(textSpan);

        document.body.appendChild(notification);

        // Desaparecer la notificación después de 2 segundos
        setTimeout(() => {
          notification.style.opacity = "0";
          notification.style.transition = "opacity 0.5s ease";
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 500);
        }, 2000);
      })
      .catch((err) => {
        console.error("Error al copiar: ", err);
        alert("No se pudo copiar al portapapeles. Error: " + err);
      });
  };

  // Renderizamos todo el componente incluyendo el modal
  return (
    <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
      <div
        className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
          isAnimating ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        style={{
          opacity: Math.max(0, 1 - currentTranslate / 400),
        }}
        onClick={handleCloseModal}
      />

      <div
        ref={modalRef}
        className={`relative bg-white w-full max-w-4xl rounded-t-lg pb-4 pt-10 transition-transform duration-300 touch-none ${
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

        <form onSubmit={handleSubmit} className="mt-4 ">
          <div className="px-4">
            <select
              name="tipoFactura"
              value={formData.tipoFactura}
              onChange={handleChange}
              className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 rounded-t-3xl border-x border-t border-black transition-all appearance-none"
              required
            >
              <option value="" disabled>
                Tipo de Factura
              </option>
              <option value="A">Factura A</option>
              <option value="B">Factura B</option>
              <option value="C">Factura C</option>
            </select>

            <input
              type="text"
              name="montoTotal"
              value={formData.montoTotal}
              onChange={handleChange}
              className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t transition-all"
              placeholder="Monto Total"
              required
            />

            <input
              type="number"
              name="cantidadFacturas"
              value={formData.cantidadFacturas}
              onChange={handleChange}
              className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t transition-all"
              placeholder="Cantidad de Facturas"
              min="1"
              required
            />

            <input
              type="text"
              name="montoMinimo"
              value={formData.montoMinimo}
              onChange={handleChange}
              className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t transition-all"
              placeholder="Monto Mínimo"
              required
            />

            <input
              type="text"
              name="montoMaximo"
              value={formData.montoMaximo}
              onChange={handleChange}
              className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-b border-t rounded-b-3xl transition-all"
              placeholder="Monto Máximo"
              required
            />

            <button
              type="button"
              onClick={generarVentas}
              disabled={isGenerating}
              className="w-full flex flex-row justify-center items-center bg-gray-200 text-black h-20 mt-4 gap-2 rounded-3xl font-bold"
            >
              {isGenerating ? (
                <LoadingPoints color="text-gray-100" />
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6"
                  >
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path
                      fill-rule="evenodd"
                      d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Ver simulacion
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 mb-4 p-4 border-l-4 border-red-500">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
          </div>

          {ventasGeneradas.length > 0 && (
            <>
              <div className="mt-4 w-full">
                <SalesCards
                  ventas={ventasGeneradas}
                  onToggleFacturar={handleToggleFacturar}
                />
              </div>

              <div className="mx-4">
                <button
                  type="submit"
                  disabled={!tokenStatus?.valid || isSubmitting}
                  className="w-full bg-black h-20 mt-4 flex items-center justify-center rounded-3xl"
                >
                  <p className="text-gray-100 font-bold text-3xl">
                    {isSubmitting ? (
                      <LoadingPoints color="text-gray-100" />
                    ) : (
                      <div className="flex flex-row items-center justify-center gap-2">
                        <p className="text-center flex justify-center w-4 h-4 bg-gray-50 rounded-full text-[10px] font-bold text-black items-center">
                          {
                            ventasGeneradas.filter(
                              (venta) => venta.quiereFacturarla
                            ).length
                          }
                        </p>
                        Enviar
                      </div>
                    )}
                  </p>
                </button>
              </div>
            </>
          )}

          {respuesta && (
            <div className="p-4 border-l-4 w-full ml-8 mt-4 mb-8 border-black">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-black text-xl font-bold mb-6">
                  Resultados
                </h3>
                <button
                  type="button"
                  onClick={copyResultsToClipboard}
                  className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md"
                >
                  Copiar
                </button>
              </div>

              <div>
                {Array.isArray(respuesta) &&
                  respuesta.map((resp, index) => (
                    <div key={index} className="mb-4 text-gray-400 text-sm">
                      <p className="text-center items-center flex justify-center w-4 h-4 bg-black rounded-full text-[10px] mb-1 font-bold text-gray-100">
                        {index + 1}
                      </p>
                      {resp.cae ? (
                        <>
                          <p>
                            CAE: <span className="text-black">{resp.cae}</span>
                          </p>
                          <p>
                            Comprobante número:{" "}
                            <span className="text-black">{resp.cbteDesde}</span>
                          </p>
                        </>
                      ) : (
                        <p className="text-red-500">
                          Error: {resp.error || "No generado"}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FacturarPorMonto;
