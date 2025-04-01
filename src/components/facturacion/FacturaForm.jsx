import { useState, useEffect, useRef } from "react";
import SalesCards from "./SalesCards";
import LoadingPoints from "../LoadingPoints";
import { ReadLastThreeDaysOrders } from "../../firebase/ReadData";
import {
  facturarPedido,
  obtenerFacturasPorRango,
  guardarFacturaPorMonto,
} from "../../firebase/afip";
import { useSelector } from "react-redux";
import FacturarPorMonto from "./FacturarPorMonto";
import Calendar from "../Calendar";
import currencyFormat from "../../helpers/currencyFormat";

// URL del backend en AWS EC2
const BASE_URL = "https://backend.onlyanhelo.com";

const FacturaForm = () => {
  const [respuesta, setRespuesta] = useState(null);
  const [error, setError] = useState(null);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [showFacturarPorMonto, setShowFacturarPorMonto] = useState(false);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const [showIndividualForm, setShowIndividualForm] = useState(false);
  const [formData, setFormData] = useState({
    cuit: "33718835289",
    puntoVenta: "2",
    tipoFactura: "B",
    importeNeto: "",
    importeTrib: "",
    importeTotal: "",
  });
  const [ventasSinFacturar, setVentasSinFacturar] = useState([]);
  const [facturasEmitidas, setFacturasEmitidas] = useState([]);
  const [isLoadingFacturas, setIsLoadingFacturas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalError, setModalError] = useState(null);
  const [modalRespuesta, setModalRespuesta] = useState(null);
  const [isLoadingModalSubmit, setIsLoadingModalSubmit] = useState(false);

  const [activeButton, setActiveButton] = useState("por-pedidos");

  const { valueDate } = useSelector((state) => state.data);

  // Modal drag states
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);

  useEffect(() => {
    if (showIndividualForm) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [showIndividualForm]);

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

  useEffect(() => {
    const fetchLastThreeDaysOrders = async () => {
      try {
        const orders = await ReadLastThreeDaysOrders();
        // console.log("Pedidos de los últimos 3 días:", orders);
      } catch (error) {
        console.error(
          "Error al obtener los pedidos de los últimos 3 días:",
          error
        );
      }
    };

    fetchLastThreeDaysOrders();
  }, []);

  const checkTokenStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/afip/token/status`);
      const data = await response.json();
      if (data.success) {
        setTokenStatus(data.data);
      } else {
        setTokenStatus({ valid: false });
      }
    } catch (error) {
      console.error("Error al verificar token:", error);
      setTokenStatus({ valid: false });
    }
  };

  useEffect(() => {
    checkTokenStatus();
    const interval = setInterval(checkTokenStatus, 300000); // Verifica cada 5 minutos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPedidosSinFacturar = async () => {
      try {
        const pedidosSinFacturar = await ReadLastThreeDaysOrders();
        // console.log(
        //   "Pedidos sin facturar de los últimos 3 días:",
        //   pedidosSinFacturar
        // );
        // console.log(
        //   "Cantidad de pedidos sin facturar:",
        //   pedidosSinFacturar.length
        // );

        // Transforma los pedidos al formato que necesita ventasSinFacturar
        const ventasFormateadas = pedidosSinFacturar.map((pedido) => ({
          id: pedido.id,
          fecha: pedido.fecha,
          hora: pedido.hora,
          importeTotal: pedido.total.toString(),
          importeNeto: (pedido.total / 1.21).toFixed(2),
          importeTrib: "0.00",
          quiereFacturarla: true, // Por defecto marcamos que queremos facturarla
        }));

        // Actualiza el estado
        setVentasSinFacturar(ventasFormateadas);
      } catch (error) {
        console.error("Error al obtener los pedidos sin facturar:", error);
      }
    };

    fetchPedidosSinFacturar();
  }, []);

  useEffect(() => {
    const fetchFacturas = async () => {
      if (!valueDate) return;

      setIsLoadingFacturas(true);
      try {
        // Usar la nueva función para obtener facturas por rango de fechas
        const facturas = await obtenerFacturasPorRango(valueDate);

        // Formatear las facturas para mostrarlas en la tabla
        const facturasFormateadas = facturas.map((factura) => ({
          id: factura.id,
          fecha: factura.fecha,
          hora: factura.hora,
          cliente: factura.pedidoId ? "Pedido" : "Por monto",
          telefono: "N/A",
          total: parseFloat(factura.importeTotal),
          cae: factura.cae,
          numeroFactura: factura.numeroComprobante,
          tipoFactura: factura.tipoComprobante,
          fechaEmision: factura.fecha,
        }));

        setFacturasEmitidas(facturasFormateadas);
      } catch (error) {
        console.error("Error al obtener las facturas:", error);
        setError("Error al cargar facturas emitidas");
      } finally {
        setIsLoadingFacturas(false);
      }
    };

    fetchFacturas();
  }, [valueDate]);

  const handleGenerateToken = async () => {
    setIsLoadingToken(true);
    setError(null);

    // Verificar si el token sigue siendo válido antes de generarlo
    await checkTokenStatus();

    if (tokenStatus?.valid) {
      setIsLoadingToken(false);
      // console.log(
      //   "El token sigue siendo válido, no se necesita generar uno nuevo."
      // );
      return; // Salir sin hacer la petición
    }

    try {
      const response = await fetch(`${BASE_URL}/api/afip/token/generate`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setTokenStatus(data.data); // Actualizar el estado con el nuevo token
      } else {
        setError("Error al generar token: " + data.message);
      }
    } catch (error) {
      setError("Error de conexión al generar token");
    } finally {
      setIsLoadingToken(false);
    }
  };

  const calcularImportes = (total, trib) => {
    const totalNumero = parseFloat(total) || 0;
    const tribNumero = parseFloat(trib) || 0;
    const neto = (totalNumero - tribNumero) / 1.21;
    setFormData((prev) => ({
      ...prev,
      importeNeto: neto.toFixed(2),
      importeTrib: tribNumero.toFixed(2),
      importeTotal: totalNumero.toFixed(2),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "importeTotal" || name === "importeTrib") {
      const newTotal = name === "importeTotal" ? value : formData.importeTotal;
      const newTrib = name === "importeTrib" ? value : formData.importeTrib;
      calcularImportes(newTotal, newTrib);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalRespuesta(null);
    setIsLoadingModalSubmit(true);
    try {
      const response = await fetch(`${BASE_URL}/api/afip/factura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      // Console log de la respuesta completa
      // console.log("Respuesta completa del backend (factura individual):", data);

      if (!response.ok) {
        throw new Error(
          `${data.message || "Error al procesar la factura"}${data.errorDetails ? `: ${data.errorDetails}` : ""}`
        );
      }

      if (data.success && data.data.resultado === "A") {
        // Crear objeto con los datos de la respuesta para mostrar
        setModalRespuesta({
          cae: data.data.cae,
          fechaVencimiento: data.data.caeFchVto,
          cbteDesde: data.data.cbteDesde,
          cbteHasta: data.data.cbteHasta,
        });

        // Crear objeto facturaData para guardar en Firebase
        const facturaData = {
          cae: data.data.cae,
          caeFchVto: data.data.caeFchVto,
          tipoComprobante: formData.tipoFactura,
          puntoVenta: formData.puntoVenta,
          numeroComprobante: data.data.cbteDesde,
          cuit: formData.cuit,
          importeTotal: formData.importeTotal,
          importeNeto: formData.importeNeto,
          importeTrib: formData.importeTrib,
          documentoReceptor: 99,
          numeroReceptor: 0,
        };

        // Guardar la factura en Firebase usando guardarFacturaPorMonto
        // que guarda en la colección "facturas" como una factura sin pedido asociado
        const guardadoExitoso = await guardarFacturaPorMonto(facturaData);

        if (!guardadoExitoso) {
          console.warn(
            "Factura emitida con éxito pero no se pudo guardar en Firebase"
          );
        } else {
          // console.log(
          //   `Factura emitida y guardada con éxito. CAE: ${data.data.cae}`
          // );
        }
      } else {
        const errorMsg =
          data.errorDetails ||
          (Array.isArray(data.data?.errores)
            ? data.data.errores.map((err) => err.Msg).join(", ")
            : data.data?.errores?.Msg ||
              data.data?.observaciones?.Msg ||
              data.message ||
              "Error desconocido");
        setModalError(errorMsg);
      }
    } catch (error) {
      setModalError(error.message || "Error de conexión con el servidor");
      console.error("Error en handleModalSubmit:", error);
    } finally {
      setIsLoadingModalSubmit(false);
    }
  };

  const handleSubmitMultiple = async (e) => {
    e.preventDefault();
    setError(null);
    setRespuesta(null);
    setIsLoadingSubmit(true);

    try {
      const ventasAFacturar = ventasSinFacturar.filter(
        (venta) => venta.quiereFacturarla
      );
      if (ventasAFacturar.length === 0) {
        setError("No hay ventas seleccionadas para facturar");
        setIsLoadingSubmit(false);
        return;
      }

      // Array para almacenar todas las respuestas
      const todasLasRespuestas = [];

      // Procesar las facturas una por una
      for (let i = 0; i < ventasAFacturar.length; i++) {
        const venta = ventasAFacturar[i];

        // Datos de facturación para el pedido actual
        const facturaData = {
          cuit: formData.cuit,
          puntoVenta: formData.puntoVenta,
          tipoFactura: formData.tipoFactura,
          importeNeto: venta.importeNeto,
          importeTrib: venta.importeTrib,
          importeTotal: venta.importeTotal,
        };

        // console.log(
        //   `Procesando factura ${i + 1}/${ventasAFacturar.length} para pedido ID: ${venta.id}`
        // );

        try {
          // Enviar solicitud para una sola factura
          const response = await fetch(`${BASE_URL}/api/afip/factura`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(facturaData),
          });

          const data = await response.json();
          // console.log(`Respuesta de factura ${i + 1}:`, data);

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

            // Crear objeto con datos de facturación para almacenar en Firebase
            const datosFacturacion = {
              cuit: formData.cuit,
              cae: data.data.cae,
              fechaEmision: new Date().toISOString(),
              tipoComprobante: formData.tipoFactura,
              puntoVenta: formData.puntoVenta,
              numeroComprobante: data.data.cbteDesde,
              documentoReceptor: 99, // Siempre 99
              numeroReceptor: 0, // Siempre 0
              caeFchVto: data.data.caeFchVto,
            };

            // Usar la nueva función para guardar el pedido como facturado
            // Esta función también guarda la información en la colección 'facturas'
            await facturarPedido(venta.id, venta.fecha, datosFacturacion);

            // console.log(
            //   `Factura ${i + 1} procesada con éxito. CAE: ${data.data.cae}`
            // );
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

            // console.log(`Error al procesar factura ${i + 1}: ${errorMsg}`);
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

      // Refrescar la lista de ventas sin facturar
      if (facturasFallidas.length < todasLasRespuestas.length) {
        // Hay al menos una factura exitosa, refrescar la lista
        try {
          const pedidosActualizados = await ReadLastThreeDaysOrders();
          const ventasFormateadas = pedidosActualizados.map((pedido) => ({
            id: pedido.id,
            fecha: pedido.fecha,
            hora: pedido.hora,
            importeTotal: pedido.total.toString(),
            importeNeto: (pedido.total / 1.21).toFixed(2),
            importeTrib: "0.00",
            quiereFacturarla: true,
          }));
          setVentasSinFacturar(ventasFormateadas);
        } catch (error) {
          console.error(
            "Error al actualizar la lista de ventas sin facturar:",
            error
          );
        }
      }
    } catch (error) {
      setError(error.message || "Error general en el proceso de facturación");
      console.error("Error en handleSubmitMultiple:", error);
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  const handleToggleFacturar = (ventaId) => {
    setVentasSinFacturar((prevVentas) =>
      prevVentas.map((venta) =>
        venta.id === ventaId
          ? { ...venta, quiereFacturarla: !venta.quiereFacturarla }
          : venta
      )
    );
  };

  const toggleIndividualForm = () => {
    setShowIndividualForm(!showIndividualForm);
    setActiveButton("individual");
  };

  const handleCloseForm = () => {
    setShowIndividualForm(false);
    setIsAnimating(false);
    setActiveButton("por-pedidos");
    // Limpiar los estados del modal al cerrarlo
    setModalError(null);
    setModalRespuesta(null);
  };

  const filteredFacturas = facturasEmitidas.filter(
    (factura) =>
      factura.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.cae.includes(searchTerm) ||
      factura.numeroFactura.toString().includes(searchTerm)
  );

  const copyFacturaToClipboard = (factura) => {
    const textToCopy =
      `CUIT: 33718835289\n` +
      `CAE: ${factura.cae}\n` +
      `Fecha: ${factura.fechaEmision}\n` +
      `Tipo: ${factura.tipoFactura}\n` +
      `PDV: 2\n` +
      `Nro ${factura.numeroFactura}\n` +
      `Total: $${factura.total.toLocaleString()}\n` +
      `Cliente: 99 0`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        // Mostrar una notificación temporal
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.bottom = "20px";
        notification.style.padding = "0 16px"; // px-4 equivale a 16px
        notification.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        notification.style.color = "white";
        notification.style.borderRadius = "9999px";
        notification.style.left = "0";
        notification.style.right = "0";
        notification.style.margin = "0 auto"; // Centrar horizontalmente
        notification.style.width = "fit-content"; // Ancho automático según contenido
        notification.style.height = "40px";
        notification.style.zIndex = "1000";
        notification.style.textAlign = "center";
        notification.style.fontFamily = "Coolvetica, sans-serif";
        notification.style.fontWeight = "300"; // font-light equivale a 300
        notification.style.fontSize = "0.75rem"; // text-xs equivale a 0.75rem (12px)
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
        svgIcon.style.width = "24px"; // h-6 equivale a 24px
        svgIcon.style.height = "24px"; // h-6 equivale a 24px
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
        textSpan.textContent = "Factura copiada al portapapeles";

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
        console.error("Error al copiar factura: ", err);
        alert("No se pudo copiar la factura al portapapeles. Error: " + err);
      });
  };

  const toggleFacturarPorMonto = () => {
    setShowFacturarPorMonto(!showFacturarPorMonto);
    setActiveButton("por-monto");
  };

  const handleCloseFacturarPorMonto = () => {
    setShowFacturarPorMonto(false);
    setActiveButton("por-pedidos");
  };

  const activatePorPedidos = () => {
    setActiveButton("por-pedidos");
    // Cerrar los otros formularios si están abiertos
    setShowFacturarPorMonto(false);
    setShowIndividualForm(false);
  };

  return (
    <>
      <style>{`
                  select:invalid { color: #9CA3AF; }
                  input[type="date"]::-webkit-calendar-picker-indicator {
                      filter: invert(100%);
                  }
              `}</style>
      <div className="font-coolvetica overflow-hidden flex flex-col items-center justify-center w-full">
        <div className="py-8 flex flex-col   w-full items-baseline">
          <div className="flex flex-col px-4">
            <h2 className="text-3xl font-bold">Facturación</h2>
            <div className="flex flex-row items-center gap-1">
              <h2 className="text-xs font-bold text-gray-400">
                {tokenStatus?.valid ? (
                  <div className="flex flex-row items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <h2 className="text-xs font-bold text-gray-400">
                      Conectado a ARCA hasta las{" "}
                      {new Date(tokenStatus.expirationTime).toLocaleTimeString(
                        "es-ES",
                        { hour: "2-digit", minute: "2-digit" }
                      )}{" "}
                      hs
                    </h2>
                  </div>
                ) : (
                  <div className="flex flex-row items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400 "></span>
                    </span>
                    <button
                      onClick={handleGenerateToken}
                      disabled={isLoadingToken}
                      className="font-bold text-xs text-gray-400"
                    >
                      {isLoadingToken
                        ? "Conectando..."
                        : "Click para conectarte a ARCA"}
                    </button>
                  </div>
                )}
              </h2>
            </div>
            {ventasSinFacturar.length === 0 ? (
              <div className="flex flex-row gap-1 -ml-[1.2px] items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-2.5 text-green-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="font-bold text-gray-400 text-xs">
                  Estás al día con tus facturas
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-row gap-2 px-4 overflow-x-auto mb-2 mt-4">
            <button
              onClick={activatePorPedidos}
              className={`gap-2 font-bold rounded-full flex-shrink-0 flex items-center px-4 h-10 ${
                activeButton === "por-pedidos"
                  ? "bg-black text-gray-100"
                  : "bg-gray-200 text-black"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6"
              >
                <path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657ZM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6ZM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 0 1 6.75 6h10.5a3 3 0 0 1 2.683 1.657A4.505 4.505 0 0 0 18.75 7.5H5.25Z" />
              </svg>
              <p>Por pedidos</p>
            </button>

            <button
              onClick={toggleFacturarPorMonto}
              className={`gap-2 font-bold rounded-full flex-shrink-0 flex items-center px-4 h-10 ${
                activeButton === "por-monto"
                  ? "bg-black text-gray-100"
                  : "bg-gray-200 text-black"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M3.75 3.375c0-1.036.84-1.875 1.875-1.875H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375Zm10.5 1.875a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25ZM12 10.5a.75.75 0 0 1 .75.75v.028a9.727 9.727 0 0 1 1.687.28.75.75 0 1 1-.374 1.452 8.207 8.207 0 0 0-1.313-.226v1.68l.969.332c.67.23 1.281.85 1.281 1.704 0 .158-.007.314-.02.468-.083.931-.83 1.582-1.669 1.695a9.776 9.776 0 0 1-.561.059v.028a.75.75 0 0 1-1.5 0v-.029a9.724 9.724 0 0 1-1.687-.278.75.75 0 0 1 .374-1.453c.425.11.864.186 1.313.226v-1.68l-.968-.332C9.612 14.974 9 14.354 9 13.5c0-.158.007-.314.02-.468.083-.931.831-1.582 1.67-1.694.185-.025.372-.045.56-.06v-.028a.75.75 0 0 1 .75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
              <p>Por monto</p>
            </button>

            <button
              onClick={toggleIndividualForm}
              className={`gap-2 font-bold rounded-full flex-shrink-0 flex items-center px-4 h-10 ${
                activeButton === "individual"
                  ? "bg-black text-gray-100"
                  : "bg-gray-200 text-black"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                  clipRule="evenodd"
                />
                <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
              </svg>
              <p>Individual</p>
            </button>
          </div>
        </div>

        <div className="w-full">
          {ventasSinFacturar.length > 0 ? (
            <div className="flex flex-col mb-12 ">
              <SalesCards
                ventas={ventasSinFacturar}
                onToggleFacturar={handleToggleFacturar}
              />
              <div className="px-4">
                <button
                  onClick={handleSubmitMultiple}
                  disabled={!tokenStatus?.valid || isLoadingSubmit}
                  className="w-full bg-black h-20 mt-4 flex items-center justify-center rounded-3xl"
                >
                  <p className="text-gray-100 font-bold text-3xl">
                    {isLoadingSubmit ? (
                      <LoadingPoints color="text-gray-100" />
                    ) : (
                      <div className="flex flex-row items-center justify-center gap-2">
                        <p className="text-center flex justify-center w-4 h-4 bg-gray-50 rounded-full text-[10px] font-bold text-black items-center">
                          {
                            ventasSinFacturar.filter(
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
            </div>
          ) : null}
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-6 mx-4 mb-8 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="text-gray-400 font-light text-xs">
              Para usar este feature necesitas tener una página web vinculada.
            </p>
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/5493585168971?text=${encodeURIComponent("Quiero adquirir este servicio: Pagina web")}`
                )
              }
              className="text-black bg-gray-200 rounded-full h-10 px-4 mt-2 font-bold flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M20.5129 3.4866C18.2882 1.24722 15.2597 -0.00837473 12.1032 4.20445e-05C5.54964 4.20445e-05 0.216056 5.33306 0.213776 11.8883C0.210977 13.9746 0.75841 16.0247 1.80085 17.8319L0.114014 23.9932L6.41672 22.34C8.15975 23.2898 10.1131 23.7874 12.0981 23.7874H12.1032C18.6556 23.7874 23.9897 18.4538 23.992 11.8986C24.0022 8.74248 22.7494 5.71347 20.5129 3.4866ZM17.5234 14.3755C17.2264 14.2267 15.7659 13.5085 15.4934 13.4064C15.2209 13.3044 15.0231 13.2576 14.8253 13.5552C14.6275 13.8528 14.058 14.5215 13.8847 14.7199C13.7114 14.9182 13.5381 14.9427 13.241 14.794C12.944 14.6452 11.9869 14.3316 10.8519 13.3198C9.96884 12.5319 9.36969 11.5594 9.19867 11.2618C9.02765 10.9642 9.18043 10.8057 9.32922 10.6552C9.46261 10.5224 9.62622 10.3086 9.77444 10.1348C9.92266 9.9609 9.97283 9.83776 10.0714 9.63938C10.1701 9.44099 10.121 9.26769 10.0469 9.1189C9.97283 8.97011 9.37824 7.50788 9.13083 6.9133C8.88969 6.3341 8.64513 6.4122 8.46271 6.40023C8.29169 6.39168 8.09102 6.38997 7.89264 6.38997C7.58822 6.39793 7.30097 6.53267 7.10024 6.76166C6.82831 7.05923 6.061 7.77752 6.061 9.23976C6.061 10.702 7.12532 12.1146 7.27354 12.313C7.42176 12.5114 9.36855 15.5117 12.3472 16.7989C12.9004 17.0375 13.4657 17.2468 14.0409 17.426C14.7523 17.654 15.3999 17.6204 15.9118 17.544C16.4819 17.4585 17.6694 16.8251 17.9173 16.1313C18.1653 15.4376 18.1648 14.8424 18.0884 14.7187C18.012 14.595 17.8204 14.5266 17.5234 14.3778V14.3755Z"
                />
              </svg>
              Solicitar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 w-full ml-8 p-4 border-l-4 border-red-500">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {respuesta && (
          <div className=" p-4 border-l-4 w-full ml-8 mb-8 border-black">
            <h3 className="text-black text-xl font-bold mb-6">Resultados</h3>

            {Array.isArray(respuesta) ? (
              respuesta.map((resp, index) => (
                <div key={index} className=" mb-4 text-gray-400 text-sm">
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
                      Error:{" "}
                      {resp.error ||
                        resp.errores?.Msg ||
                        (Array.isArray(resp.errores)
                          ? resp.errores.map((e) => e.Msg).join(", ")
                          : "No generado")}
                      {resp.details && <span> - {resp.details}</span>}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="space-y-1 text-gray-700 text-sm">
                <p>
                  CAE: <span className="text-black">{respuesta.cae}</span>
                </p>
                <p>
                  Número:{" "}
                  <span className="text-black">{respuesta.cbteDesde}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Calendar component for date selection */}
        <div className="w-full px-4  mb-4">
          <h3 className="text- font-bold mb-2">Historial</h3>
          <Calendar />
          <div className="flex items-center w-full h-10 gap-1 mt-2 rounded-lg border-4 border-black focus:ring-0 font-coolvetica text-black text-xs font-light">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 ml-1.5 mb-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por cliente, CAE o número de factura"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Display list of facturas */}
        <div className="w-full mb-8 mt-4">
          {isLoadingFacturas ? (
            <div className="flex justify-center items-center py-8">
              <LoadingPoints color="text-black" />
            </div>
          ) : filteredFacturas.length > 0 ? (
            <div className="w-full">
              <table className="w-full text-xs text-left text-black">
                <thead className="text-black border-b h-10">
                  <tr>
                    <th scope="col" className="pl-4 py-2">
                      CAE
                    </th>
                    <th scope="col" className="pl-4 py-2">
                      Fecha
                    </th>
                    <th scope="col" className="pl-4 py-2">
                      Tipo
                    </th>
                    <th scope="col" className="pl-4 py-2">
                      PDV
                    </th>
                    <th scope="col" className="pl-4 py-2">
                      Nro
                    </th>
                    <th scope="col" className="pl-4 py-2">
                      Total
                    </th>
                    <th scope="col" className="pl-4 py-2">
                      Cliente
                    </th>
                    <th scope="col" className="pl-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacturas.map((factura) => (
                    <tr
                      key={factura.id}
                      className="text-black border-y font-light h-10 border-gray-200 "
                    >
                      <td className="pl-4 font-light">
                        {factura.cae ? `${factura.cae.substring(0, 4)}...` : ""}
                      </td>
                      <td className="pl-4 font-light">
                        {factura.fechaEmision}
                      </td>
                      <td className="pl-4 font-light">{factura.tipoFactura}</td>
                      <td className="pl-4 font-light">2</td>
                      <td className="pl-4 font-light">
                        {" "}
                        {factura.numeroFactura}
                      </td>
                      <td className="pl-4 font-light">
                        {currencyFormat(factura.total)}
                      </td>
                      <td className="pl-4 font-light">99 0</td>
                      <td className="pl-4 font-light pr-4">
                        <button
                          onClick={() => copyFacturaToClipboard(factura)}
                          className="cursor-pointer hover:opacity-75 transition-opacity"
                          title="Copiar datos de factura"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-6"
                          >
                            <path
                              fillRule="evenodd"
                              d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 0 1-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0 1 13.5 1.5H15a3 3 0 0 1 2.663 1.618ZM12 4.5A1.5 1.5 0 0 1 13.5 3H15a1.5 1.5 0 0 1 1.5 1.5H12Z"
                              clipRule="evenodd"
                            />
                            <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 0 1 9 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0 1 16.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625v-12Z" />
                            <path d="M10.5 10.5a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279h-1.875a.375.375 0 0 1-.375-.375V10.5Z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : valueDate ? (
            <div className="text-center pt-6 text-xs px-4 text-gray-400">
              No hay facturas emitidas en el período seleccionado
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 ">
              Selecciona un rango de fechas para ver las facturas emitidas
            </div>
          )}
        </div>

        {/* Modal para formulario individual */}
        {showIndividualForm && (
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

              {/* Mostrar resultados o formulario basado en si hay respuesta modal */}
              {modalRespuesta ? (
                // Solo mostrar los resultados
                <div>
                  <div className="p-4 border-l-4 w-full mt-4 mb-4 border-black">
                    <h3 className="text-black text-xl font-bold mb-6">
                      Resultados
                    </h3>

                    <div className="space-y-1 text-gray-700 text-sm">
                      <p>
                        CAE:{" "}
                        <span className="text-black">{modalRespuesta.cae}</span>
                      </p>
                      <p>
                        Número:{" "}
                        <span className="text-black">
                          {modalRespuesta.cbteDesde}
                        </span>
                      </p>
                      <p>
                        Vencimiento:{" "}
                        <span className="text-black">
                          {modalRespuesta.fechaVencimiento}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Mostrar el formulario si no hay respuesta
                <form onSubmit={handleModalSubmit} className="mt-4">
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
                    name="cuit"
                    value={formData.cuit}
                    onChange={handleChange}
                    className="w-full text-black bg-transparent rounded-none text-xs border-gray-200 h-10 px-4 border-x border-t transition-all"
                    readOnly
                    placeholder="CUIT Emisor"
                  />
                  <input
                    type="number"
                    name="puntoVenta"
                    value={formData.puntoVenta}
                    onChange={handleChange}
                    className="w-full text-black text-xs rounded-none bg-transparent h-10 border-gray-200 px-4 border-x border-t transition-all"
                    required
                    placeholder="Punto de Venta"
                  />
                  <input
                    type="number"
                    name="importeTotal"
                    value={formData.importeTotal}
                    onChange={handleChange}
                    className="w-full border-gray-200 rounded-none bg-transparent text-black text-xs border-x border-t h-10 px-4 transition-all"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Importe Total"
                  />
                  <input
                    type="number"
                    name="importeTrib"
                    value={formData.importeTrib}
                    onChange={handleChange}
                    className="w-full text-black h-10 px-4 rounded-none bg-transparent text-xs border-x border-t border-gray-200 transition-all"
                    step="0.01"
                    min="0"
                    placeholder="Tasa Municipal"
                  />

                  <input
                    type="number"
                    name="importeNeto"
                    value={formData.importeNeto}
                    className="w-full border-gray-200 bg-transparent text-black text-xs border-x border-b border-t h-10 px-4 rounded-b-3xl"
                    readOnly
                    placeholder="Importe Neto"
                  />
                  <button
                    type="submit"
                    disabled={!tokenStatus?.valid || isLoadingModalSubmit}
                    className="w-full bg-black h-20 mt-4 rounded-3xl"
                  >
                    <p className="text-gray-100 font-bold text-4xl">
                      {isLoadingModalSubmit ? (
                        <LoadingPoints color="text-gray-100" />
                      ) : (
                        "Enviar"
                      )}
                    </p>
                  </button>
                </form>
              )}

              {modalError && (
                <div className="mt-4 mb-4 p-4 border-l-4 border-red-500">
                  <p className="text-red-500 text-sm">{modalError}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal para facturas por monto */}
        {showFacturarPorMonto && (
          <FacturarPorMonto
            onClose={handleCloseFacturarPorMonto}
            tokenStatus={tokenStatus}
            visible={showFacturarPorMonto}
          />
        )}
      </div>
    </>
  );
};

export default FacturaForm;
