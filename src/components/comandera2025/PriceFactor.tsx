import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';

const VENTAS_MAXIMAS = 250;

const PriceFactor = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentFactor, setCurrentFactor] = useState(1.0);
    const [fakeVentas, setFakeVentas] = useState(0);

    // Función para calcular el factor con curva suave
    const calcularFactor = (ventas: number) => {
        const porcentajeAvance = ventas / VENTAS_MAXIMAS;
        const factorIncremento = Math.pow(porcentajeAvance, 0.8) * 0.11; // máximo 11%
        return Math.ceil((1 + factorIncremento) * 100) / 100; // Redondear a 2 decimales
    };

    // Simular ventas cuando está activo
    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                setFakeVentas(prev => {
                    if (prev >= VENTAS_MAXIMAS) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 500);
        } else {
            setFakeVentas(0);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    // Actualizar factor basado en ventas
    useEffect(() => {
        const nuevoFactor = calcularFactor(fakeVentas);
        setCurrentFactor(nuevoFactor);

        const updateFirebaseFactor = async () => {
            try {
                const firestore = getFirestore();
                const constantesRef = doc(firestore, 'constantes', 'altaDemanda');
                await updateDoc(constantesRef, {
                    priceFactor: nuevoFactor
                });
            } catch (error) {
                console.error('Error actualizando factor:', error);
            }
        };

        if (isActive) {
            updateFirebaseFactor();
        }
    }, [fakeVentas]);

    return (
        <div className="flex flex-col items-center gap-4 bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`px-6 py-2 rounded-full font-bold transition-colors ${isActive
                            ? 'bg-red-main text-white hover:bg-red-700'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                >
                    {isActive ? 'Desactivar' : 'Activar'} Dynamic Pricing
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Factor actual:</span>
                    <span className="text-lg font-bold text-red-main">
                        x{currentFactor.toFixed(2)} (+{((currentFactor - 1) * 100).toFixed(1)}%)
                    </span>
                </div>
            </div>

            {isActive && (
                <>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-red-main h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${(fakeVentas / VENTAS_MAXIMAS) * 100}%` }}
                        ></div>
                    </div>

                    <div className="text-sm text-gray-600">
                        Ventas simuladas: {fakeVentas} / {VENTAS_MAXIMAS}
                    </div>

                    <div className="w-full max-w-md">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="font-bold mb-2">Incrementos de precio (curva suave)</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>50 ventas: +{(calcularFactor(50) - 1) * 100}%</div>
                                <div>100 ventas: +{(calcularFactor(100) - 1) * 100}%</div>
                                <div>150 ventas: +{(calcularFactor(150) - 1) * 100}%</div>
                                <div>200 ventas: +{(calcularFactor(200) - 1) * 100}%</div>
                                <div>250 ventas: +{(calcularFactor(250) - 1) * 100}%</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PriceFactor;