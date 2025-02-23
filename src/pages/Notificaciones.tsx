import React, { useState, useEffect } from "react";
import { ReadDataForDateRange } from "../firebase/ReadData"; // Importamos la función para obtener datos
import { PedidoProps } from "../types/types"; // Tipado de los pedidos

export const Notificaciones: React.FC = () => {
    const [pedidosConReclamo, setPedidosConReclamo] = useState<PedidoProps[]>([]); // Estado para almacenar los pedidos con reclamo
    const [loading, setLoading] = useState(true); // Estado para manejar la carga

    // useEffect para obtener los pedidos con reclamo de los últimos 3 días
    useEffect(() => {
        const fetchPedidosConReclamo = async () => {
            try {
                // Calcular el rango de los últimos 3 días
                const today = new Date();
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(today.getDate() - 3);

                const dateRange = {
                    startDate: threeDaysAgo.toISOString().split("T")[0], // Formato YYYY-MM-DD
                    endDate: today.toISOString().split("T")[0], // Formato YYYY-MM-DD
                };

                // Obtener los pedidos del rango de fechas
                const pedidos = await ReadDataForDateRange<PedidoProps>("pedidos", dateRange);

                // Filtrar solo los pedidos con la propiedad reclamo
                const reclamos = pedidos.filter(order => 'reclamo' in order);

                // Actualizar el estado con los pedidos filtrados
                setPedidosConReclamo(reclamos);
            } catch (error) {
                console.error("Error al obtener pedidos con reclamo:", error);
            } finally {
                setLoading(false); // Termina la carga independientemente del resultado
            }
        };

        fetchPedidosConReclamo();
    }, []); // Se ejecuta solo al montar el componente

    return (
        <div className="min-h-screen font-coolvetica bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-6">Notificaciones</h1>

            {loading ? (
                <p className="text-lg">Cargando pedidos con reclamos...</p>
            ) : pedidosConReclamo.length > 0 ? (
                <ul className="space-y-4">
                    {pedidosConReclamo.map((pedido) => (
                        <li
                            key={pedido.id}
                            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
                        >
                            <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center">

                                    <span className="text-sm text-gray-500">
                                        {pedido.fecha} - {pedido.hora}
                                    </span>
                                </div>
                                <p>
                                    <strong>Total:</strong> ${pedido.total}
                                </p>
                                <div className="border-t pt-2">
                                    <p>
                                        <strong>Descripcion:</strong> {pedido.reclamo?.descripcion || "Sin descripción"}
                                    </p>
                                    <p>
                                        <strong>Alias:</strong> {pedido.reclamo?.alias || "Desconocido"}
                                    </p>

                                    <p>
                                        <strong>Resuelto:</strong>{" "}
                                        {pedido.reclamo?.resuelto ? "Sí" : "No"}
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