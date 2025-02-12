import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';

// Simulación de datos de ventas
const FAKE_DB = {
    ventasHoy: 0,
    ventasMinimas: 100,
    ventasMaximas: 250,
    factores: {
        base: 1.0,
        nivel1: 1.05, // >50 productos
        nivel2: 1.07, // >100 productos
        nivel3: 1.09, // >150 productos
        nivel4: 1.11, // >200 productos
    }
};

const PriceFactor = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentFactor, setCurrentFactor] = useState(1.0);
    const [fakeVentas, setFakeVentas] = useState(0);

    // Simular ventas cuando está activo
    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                setFakeVentas(prev => {
                    if (prev >= FAKE_DB.ventasMaximas) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 500); // Incrementa cada 500ms para simulación
        } else {
            setFakeVentas(0);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    // Calcular factor basado en ventas
    useEffect(() => {
        const calcularFactor = () => {
            if (fakeVentas > 200) return FAKE_DB.factores.nivel4;
            if (fakeVentas > 150) return FAKE_DB.factores.nivel3;
            if (fakeVentas > 100) return FAKE_DB.factores.nivel2;
            if (fakeVentas > 50) return FAKE_DB.factores.nivel1;
            return FAKE_DB.factores.base;
        };

        const nuevoFactor = calcularFactor();
        setCurrentFactor(nuevoFactor);

        // Aquí iría la actualización a Firebase
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

    const togglePriceFactor = () => {
        setIsActive(!isActive);
    };

    return (
        <div className="flex flex-col items-center gap-4 bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-4">
                <button
                    onClick={togglePriceFactor}
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
                        x{currentFactor.toFixed(2)}
                    </span>
                </div>
            </div>

            {isActive && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-red-main h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(fakeVentas / FAKE_DB.ventasMaximas) * 100}%` }}
                    ></div>
                </div>
            )}

            <div className="text-sm text-gray-600">
                Ventas simuladas: {fakeVentas} / {FAKE_DB.ventasMaximas}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm w-full max-w-md">
                <div className="bg-white p-2 rounded shadow">
                    <span className="font-medium">{">"} 50 productos:</span> x1.05
                </div>
                <div className="bg-white p-2 rounded shadow">
                    <span className="font-medium">{">"} 100 productos:</span> x1.07
                </div>
                <div className="bg-white p-2 rounded shadow">
                    <span className="font-medium">{">"} 150 productos:</span> x1.09
                </div>
                <div className="bg-white p-2 rounded shadow">
                    <span className="font-medium">{">"} 200 productos:</span> x1.11
                </div>
            </div>
        </div>
    );
};

export default PriceFactor;