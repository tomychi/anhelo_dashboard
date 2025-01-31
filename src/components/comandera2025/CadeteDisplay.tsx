import React, { useState } from 'react';
import { CadetData, RecorridoData } from '../../types/comandera2025types';

interface CadeteDisplayProps {
    cadete: CadetData;
    handleCadeteSalida: (cadete: CadetData) => void;
    handleCadeteRegreso: (cadete: CadetData) => void;
}

const CadeteDisplay: React.FC<CadeteDisplayProps> = ({
    cadete,
    handleCadeteSalida,
    handleCadeteRegreso
}) => {
    const [showCompleted, setShowCompleted] = useState(false);

    const recorridos = cadete.recorridos || [];
    const activeRecorrido = recorridos.find(r => !r.regreso);
    const completedRecorridos = recorridos.filter(r => r.regreso);

    const renderRecorrido = (recorrido: RecorridoData, index: number, isCompleted = false) => {
        let tiempoAcumulado = 0;

        return (
            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 text-sm">
                <div className="font-medium text-gray-800">
                    {isCompleted ? `Recorrido Completado ${index + 1}` : 'Recorrido Actual'}
                </div>
                <div className="text-gray-600 mt-1">
                    <div className="mb-1">
                        Direcciones:
                        {recorrido.datosEstimados.pedidos.map((pedido, idx) => {
                            const horaBase = new Date();
                            const horaLlegada = new Date(horaBase.getTime() + (tiempoAcumulado + pedido.tiempoPercibido) * 60000);
                            const horaFormateada = horaLlegada.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            tiempoAcumulado += pedido.tiempoPercibido;

                            return (
                                <div key={idx} className="ml-2 text-xs flex justify-between items-center">
                                    <span>• {pedido.direccion.split(',')[0]}</span>
                                    <span className="text-gray-500">
                                        (llegada estimada: {horaFormateada})
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Regresa aprox. a las: {recorrido.datosEstimados.horaRegreso}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Distancia est.: {recorrido.datosEstimados.totalDistance}km</span>
                        <span>Tiempo est.: {recorrido.datosEstimados.totalTime}min</span>
                    </div>
                    {isCompleted && recorrido.regreso && (
                        <div className="text-xs text-gray-500 mt-1">
                            Completado: {recorrido.regreso instanceof Date ?
                                recorrido.regreso.toLocaleTimeString() :
                                new Date(recorrido.regreso.seconds * 1000).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center w-full">
            <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${cadete.available ? "bg-green-500" : "bg-red-500"}`}></div>
                <h3 className="text-lg font-semibold">{cadete.name}</h3>
            </div>

            {cadete.available ? (
                <button
                    onClick={() => handleCadeteSalida(cadete)}
                    className="mt-2 px-4 py-1 bg-red-main text-white rounded-full text-sm hover:bg-red-700 transition-colors"
                >
                    SALIO
                </button>
            ) : (
                <button
                    onClick={() => handleCadeteRegreso(cadete)}
                    className="mt-2 px-4 py-1 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 transition-colors"
                >
                    REGRESO
                </button>
            )}

            {recorridos.length > 0 && (
                <div className="mt-4 w-full">
                    {activeRecorrido && (
                        <>
                            <h4 className="font-medium text-gray-700 mb-2">Recorrido Actual:</h4>
                            {renderRecorrido(activeRecorrido, 0)}
                        </>
                    )}

                    {completedRecorridos.length > 0 && (
                        <>
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-between hover:bg-gray-200 transition-colors"
                            >
                                <span>Recorridos Anteriores ({completedRecorridos.length})</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-5 w-5 transform transition-transform ${showCompleted ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showCompleted && (
                                <div className="mt-2">
                                    {completedRecorridos.map((recorrido, index) =>
                                        renderRecorrido(recorrido, index, true)
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CadeteDisplay;