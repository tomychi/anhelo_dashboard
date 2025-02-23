import React, { useState, useEffect } from "react";
import { ReadDataForDateRange } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { getFirestore, collection, doc, runTransaction } from "firebase/firestore";

export const Notificaciones: React.FC = () => {
    const [pedidosConReclamo, setPedidosConReclamo] = useState<PedidoProps[]>([]);
    const [loading, setLoading] = useState(true);

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
                                resuelto: true, // Cambiamos resuelto a true
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

            // Actualizamos el estado local para reflejar el cambio inmediatamente
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
        <div className="min-h-screen font-coolvetica bg-gray-100 p-4">
            <h1 className="font-bold mb-6">Ultimos 3 dias</h1>

            {loading ? (
                <p className="text-xs">Cargando pedidos con reclamos...</p>
            ) : pedidosConReclamo.length > 0 ? (
                <ul className="space-y-4">
                    {pedidosConReclamo.map((pedido) => (
                        <li
                            key={pedido.id}
                            className=""
                        >
                            <div className="flex flex-col ">
                                <div className="flex flex-row justify-between ">
                                    <p className="text-4xl font-bold">${pedido.total}</p>
                                    {/* Botón para marcar como resuelto */}
                                    {!pedido.reclamo?.resuelto && (
                                        <button
                                            onClick={() => marcarReclamoComoResuelto(pedido.id, pedido.fecha)}
                                            className=" bg-green-500 text-gray-100 px-3 h-10 rounded-lg "
                                        >
                                            Resuelto
                                        </button>
                                    )}
                                </div>

                                {/* body */}
                                <div className=" pt-2">
                                    <p className="text-sm font-light">
                                        {pedido.reclamo?.alias || "Desconocido"}:{" "}
                                        {pedido.reclamo?.descripcion || "Sin descripción"}. <span className="text-sm ml-2 font-light text-gray-400">
                                            {pedido.fecha} - {pedido.hora}
                                        </span>
                                    </p>


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