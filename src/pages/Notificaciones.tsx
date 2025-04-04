import React, { useState, useEffect } from "react";
import { ReadDataForDateRange } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import {
  getFirestore,
  collection,
  doc,
  runTransaction,
} from "firebase/firestore";
import currencyFormat from "../helpers/currencyFormat";

export const Notificaciones: React.FC = () => {
  const [pedidosConReclamo, setPedidosConReclamo] = useState<PedidoProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPedidos, setExpandedPedidos] = useState<{
    [key: string]: boolean;
  }>({});

  const formatearFechaHora = (fecha: string, hora: string) => {
    const [dia, mes, anio] = fecha.split("/");
    const meses = [
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ];
    const mesTexto = meses[parseInt(mes, 10) - 1];
    return `${parseInt(dia, 10)} ${mesTexto} • ${hora}`;
  };

  useEffect(() => {
    const fetchPedidosConReclamo = async () => {
      try {
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const dateRange = {
          startDate: threeDaysAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };

        const pedidos = await ReadDataForDateRange<PedidoProps>(
          "pedidos",
          dateRange
        );

        const reclamos = pedidos.filter((order) => "reclamo" in order);
        // console.log("Pedidos con reclamos:", reclamos);

        setPedidosConReclamo(reclamos);
      } catch (error) {
        console.error("Error al obtener pedidos con reclamo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidosConReclamo();
  }, []);

  const marcarReclamoComoResuelto = async (pedidoId: string, fecha: string) => {
    const firestore = getFirestore();
    const [dia, mes, anio] = fecha.split("/");
    const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    try {
      await runTransaction(firestore, async (transaction) => {
        const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
        if (!pedidoDocSnapshot.exists()) {
          throw new Error("El documento del día no existe en Firestore");
        }

        const existingData = pedidoDocSnapshot.data();
        const pedidosDelDia = existingData.pedidos || [];

        const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
          if (pedido.id === pedidoId && "reclamo" in pedido) {
            return {
              ...pedido,
              reclamo: {
                ...pedido.reclamo,
                resuelto: true,
              },
            };
          }
          return pedido;
        });

        transaction.set(pedidoDocRef, {
          ...existingData,
          pedidos: pedidosActualizados,
        });
      });

      setPedidosConReclamo((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido.id === pedidoId && pedido.reclamo
            ? { ...pedido, reclamo: { ...pedido.reclamo, resuelto: true } }
            : pedido
        )
      );
      // console.log(`Reclamo del pedido ${pedidoId} marcado como resuelto`);
    } catch (error) {
      console.error("Error al marcar el reclamo como resuelto:", error);
    }
  };

  const handleResolverClick = async (
    pedidoId: string,
    fecha: string,
    total: number,
    alias: string | undefined,
    descripcion: string | undefined,
    resuelto: boolean | undefined
  ) => {
    // Crear el texto del mensaje
    const textoMensaje = `Total: ${currencyFormat(total)}\nAlias: ${alias || "Desconocido"}\nDescripción: ${descripcion || "Sin descripción"}`;

    // Solo marcamos como resuelto si no lo está ya
    if (!resuelto) {
      await marcarReclamoComoResuelto(pedidoId, fecha);
    }

    // Codificar el texto para la URL de WhatsApp
    const textoCodificado = encodeURIComponent(textoMensaje);
    const numeroWhatsApp = "+5493584127742";
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${textoCodificado}`;

    // Abrir WhatsApp en una nueva pestaña
    window.open(urlWhatsApp, "_blank");
  };

  const togglePedidoExpanded = (pedidoId: string) => {
    setExpandedPedidos((prev) => ({
      ...prev,
      [pedidoId]: !prev[pedidoId],
    }));
  };

  return (
    <div className="min-h-screen font-coolvetica bg-gray-100 ">
      <h2 className="font-bold text-3xl py-8 px-4 ">Notificaciones</h2>
      <h2 className="font-bold px-4  pb-2">Ultimos 3 dias</h2>

      {loading ? (
        <p className="text-xs p-4"></p>
      ) : pedidosConReclamo.length > 0 ? (
        <ul>
          {pedidosConReclamo.map((pedido) => (
            <li key={pedido.id} className="">
              <div className="flex flex-col pt-2">
                <div className="flex flex-row px-4 pb-2 justify-between items-center">
                  <div className="flex flex-col">
                    <p className="text-2xl font-bold">
                      {currencyFormat(pedido.total)}
                    </p>
                    <div className="flex flex-col">
                      <p className="text-xs font-light text-gray-400">
                        {pedido.reclamo?.alias || "Desconocido"}:{" "}
                        {pedido.reclamo?.descripcion || "Sin descripción"}.{" "}
                      </p>
                      <p className="text-xs font-light text-gray-400">
                        {formatearFechaHora(pedido.fecha, pedido.hora)}
                      </p>

                      {/* Toggle para mostrar productos */}
                      <button
                        onClick={() => togglePedidoExpanded(pedido.id)}
                        className="text-xs text-blue-500 mt-1 flex items-center"
                      >
                        {expandedPedidos[pedido.id] ? (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                            Ocultar productos
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                            Ver productos
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() =>
                        handleResolverClick(
                          pedido.id,
                          pedido.fecha,
                          pedido.total,
                          pedido.reclamo?.alias,
                          pedido.reclamo?.descripcion,
                          pedido.reclamo?.resuelto
                        )
                      }
                      className={`px-3 h-10 rounded-full flex flex-row gap-2 items-center ${
                        pedido.reclamo?.resuelto
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 0 1-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0 1 13.5 1.5H15a3 3 0 0 1 2.663 1.618ZM12 4.5A1.5 1.5 0 0 1 13.5 3H15a1.5 1.5 0 0 1 1.5 1.5H12Z"
                          clipRule="evenodd"
                        />
                        <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 0 1 9 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0 1 16.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625v-12Z" />
                        <path d="M10.5 10.5a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279h-1.875a.375.375 0 0 1-.375-.375V10.5Z" />
                      </svg>
                      <p>
                        {pedido.reclamo?.resuelto ? "Resuelto" : "Resolver"}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Sección expandible para mostrar los productos */}
                {expandedPedidos[pedido.id] && pedido.detallePedido && (
                  <div className="px-4 pb-2 bg-gray-50 rounded-md mx-4 mb-2">
                    <h3 className="font-medium text-sm pt-2 pb-1">
                      Productos:
                    </h3>
                    <ul className="space-y-1">
                      {pedido.detallePedido.map((item, index) => (
                        <li
                          key={index}
                          className="text-xs border-l-2 border-gray-300 pl-2"
                        >
                          <div className="flex justify-between">
                            <span>
                              {item.quantity}x {item.burger}
                            </span>
                            <span className="font-medium">
                              {currencyFormat(item.subTotal)}
                            </span>
                          </div>
                          {item.toppings && item.toppings.length > 0 && (
                            <ul className="pl-4 text-gray-500">
                              {item.toppings.map((topping, idx) => (
                                <li key={idx} className="text-xs">
                                  + {topping.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between text-xs font-medium pt-2 pb-1 border-t border-gray-200 mt-2">
                      <span>Subtotal:</span>
                      <span>{currencyFormat(pedido.subTotal)}</span>
                    </div>
                    {pedido.envio > 0 && (
                      <div className="flex justify-between text-xs pb-1">
                        <span>Envío:</span>
                        <span>{currencyFormat(pedido.envio)}</span>
                      </div>
                    )}
                    {pedido.envioExpress > 0 && (
                      <div className="flex justify-between text-xs pb-1">
                        <span>Envío express:</span>
                        <span>{currencyFormat(pedido.envioExpress)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-1 pb-2">
                      <span>Total:</span>
                      <span>{currencyFormat(pedido.total)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-1 ">
                  <div className="h-[1px] w-4/5 bg-gray-200" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs px-4 text-gray-400">
          No hay pedidos con reclamos en los últimos 3 días.
        </p>
      )}
    </div>
  );
};

export default Notificaciones;
