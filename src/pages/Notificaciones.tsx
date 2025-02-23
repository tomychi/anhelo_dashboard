import React, { useState, useEffect } from "react";
import { ReadDataForDateRange } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { getFirestore, collection, doc, runTransaction } from "firebase/firestore";
import currencyFormat from "../helpers/currencyFormat";

export const Notificaciones: React.FC = () => {
    const [pedidosConReclamo, setPedidosConReclamo] = useState<PedidoProps[]>([]);
    const [loading, setLoading] = useState(true);

    // Función para formatear fecha y hora
    const formatearFechaHora = (fecha: string, hora: string) => {
        const [dia, mes, anio] = fecha.split("/"); // Divide la fecha en día, mes y año
        const meses = [
            "ene", "feb", "mar", "abr", "may", "jun",
            "jul", "ago", "sep", "oct", "nov", "dic"
        ];
        const mesTexto = meses[parseInt(mes, 10) - 1]; // Convierte el mes numérico a texto
        return `${parseInt(dia, 10)} ${mesTexto} •  ${hora}`; // Quita ceros iniciales del día y agrega "hs"
    };

    // useEffect para obtener los pedidos con reclamo de los últimos 3 días
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

                const pedidos = await ReadDataForDateRange<PedidoProps>("pedidos", dateRange);
                const reclamos = pedidos.filter(order => 'reclamo' in order);
                setPedidosConReclamo(reclamos);
            } catch (error) {
                console.error("Error al obtener pedidos con reclamo:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPedidosConReclamo();
    }, []);

    // Función para marcar un reclamo como resuelto
    const marcarReclamoComoResuelto = async (pedidoId: string, fecha: string) => {
        const firestore = getFirestore();
        const [dia, mes, anio] = fecha.split('/');
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
                    if (pedido.id === pedidoId && 'reclamo' in pedido) {
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

            setPedidosConReclamo(prevPedidos =>
                prevPedidos.map(pedido =>
                    pedido.id === pedidoId && pedido.reclamo
                        ? { ...pedido, reclamo: { ...pedido.reclamo, resuelto: true } }
                        : pedido
                )
            );
            console.log(`Reclamo del pedido ${pedidoId} marcado como resuelto`);
        } catch (error) {
            console.error("Error al marcar el reclamo como resuelto:", error);
        }
    };

    return (
        <div className="min-h-screen font-coolvetica bg-gray-100 ">
            <h2 className="font-bold text-3xl  px-4 pt-6 ">Notificaciones</h2>

            <h2 className="font-bold px-4 pt-4 pb-2">Compensaciones</h2>

            {loading ? (
                <p className="text-xs p-4">Cargando pedidos con reclamos...</p>
            ) : pedidosConReclamo.length > 0 ? (
                <ul>
                    {pedidosConReclamo.map((pedido) => (
                        <li key={pedido.id} className="">
                            <div className="flex flex-col pt-2">
                                {/* contenido */}
                                <div className="flex flex-row px-4 pb-2 justify-between items-center">
                                    {/* izquierda */}
                                    <div className="flex flex-col">
                                        <p className="text-2xl font-bold">{currencyFormat(pedido.total)}</p>
                                        {/* body */}
                                        <div className="flex flex-col">
                                            <p className="text-xs font-light text-gray-400">
                                                {pedido.reclamo?.alias || "Desconocido"}:{" "}
                                                {pedido.reclamo?.descripcion || "Sin descripción"}.{" "}

                                            </p>
                                            <p className="text-xs font-light text-gray-400">
                                                {formatearFechaHora(pedido.fecha, pedido.hora)}
                                            </p>
                                        </div>
                                    </div>
                                    {/* derecha */}
                                    <div className="ml-4">
                                        {/* Botón para marcar como resuelto */}
                                        {!pedido.reclamo?.resuelto && (
                                            <button
                                                onClick={() => marcarReclamoComoResuelto(pedido.id, pedido.fecha)}
                                                className=" bg-gray-300  px-3 h-10 rounded-full flex flex-row gap-2 items-center "
                                            >

                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 text-black">
                                                    <path fill-rule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 0 1-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0 1 13.5 1.5H15a3 3 0 0 1 2.663 1.618ZM12 4.5A1.5 1.5 0 0 1 13.5 3H15a1.5 1.5 0 0 1 1.5 1.5H12Z" clip-rule="evenodd" />
                                                    <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 0 1 9 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0 1 16.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625v-12Z" />
                                                    <path d="M10.5 10.5a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279h-1.875a.375.375 0 0 1-.375-.375V10.5Z" />
                                                </svg>

                                                <p className="text-black">

                                                    Resolver
                                                </p>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* border */}
                                <div className="flex justify-end mt-1 ">
                                    <div className="h-[1px] w-4/5 bg-gray-300" />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-lg text-gray-600">
                    No hay pedidos con reclamos en los últimos 3 días.
                </p>
            )}
        </div>
    );
};

export default Notificaciones;