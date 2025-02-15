import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';

const VENTAS_MAXIMAS = 250;

const Toggle = ({ isOn, onToggle }) => (
    <div
        className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer bg-gray-100  ${isOn ? "bg-opacity-80" : "bg-opacity-50 "}`}
        onClick={onToggle}
    >
        <div
            className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? "translate-x-6" : ""}`}
        />
    </div>
);

const PriceFactor = () => {
    // 1. Todos los useState primero
    const [isActive, setIsActive] = useState(false);
    const [currentFactor, setCurrentFactor] = useState(1.0);
    const [hasSetPrediction, setHasSetPrediction] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false);
    const [testProductos, setTestProductos] = useState(0);
    const [testHora, setTestHora] = useState(20);

    // 2. useSelector después de todos los useState
    const totalProductosVendidos = useSelector((state: RootState) => state.data.totalProductosVendidos ?? 0);

    // 3. Variables derivadas
    const productosActuales = isTestMode ? testProductos : totalProductosVendidos;

    // 4. Funciones
    const calcularFactor = (ventas: number) => {
        const porcentajeAvance = ventas / VENTAS_MAXIMAS;
        const factorIncremento = Math.pow(porcentajeAvance, 0.8) * 0.11;
        return Math.ceil((1 + factorIncremento) * 100) / 100;
    };

    const predecirFactor = (productosEnPrimeraHora: number) => {
        if (productosEnPrimeraHora >= 25) return 1.11;
        if (productosEnPrimeraHora >= 15) return 1.09;
        if (productosEnPrimeraHora >= 10) return 1.07;
        return 1.06;
    };

    const updateFirebaseFactor = async (factor: number) => {
        try {
            const firestore = getFirestore();
            const constantesRef = doc(firestore, 'constantes', 'altaDemanda');
            await updateDoc(constantesRef, {
                priceFactor: factor
            });
        } catch (error) {
            console.error('Error actualizando factor:', error);
        }
    };

    // Effect para manejar SOLO la reactivación del toggle después de las 21
    useEffect(() => {
        if (!isActive) return;

        const hora = isTestMode ? testHora : new Date().getHours();

        if (hora >= 21 && !hasSetPrediction) {
            console.log('🎯 Reactivación después de las 21:00');
            const factorPredicho = predecirFactor(productosActuales);
            console.log(`- Recuperando ventas primera hora: ${productosActuales}`);
            console.log(`- Recalculando predicción: ${factorPredicho}`);
            updateFirebaseFactor(factorPredicho);
            setCurrentFactor(factorPredicho);
            setHasSetPrediction(true);
        }
    }, [isActive]);

    // Effect original que maneja toda la lógica normal
    useEffect(() => {
        if (!isActive) {
            updateFirebaseFactor(1.0);
            setCurrentFactor(1.0);
            setHasSetPrediction(false);
            return;
        }

        const hora = isTestMode ? testHora : new Date().getHours();
        const minutos = isTestMode ? 0 : new Date().getMinutes();

        if (hora === 21 && minutos === 0 && !hasSetPrediction) {
            console.log('🎯 Momento de predicción (21:00)');
            const factorPredicho = predecirFactor(productosActuales);
            console.log(`- Productos en primera hora: ${productosActuales}`);
            console.log(`- Factor predicho: ${factorPredicho}`);
            updateFirebaseFactor(factorPredicho);
            setCurrentFactor(factorPredicho);
            setHasSetPrediction(true);
        } else if (hora >= 21 && hasSetPrediction) {
            const factorGradual = calcularFactor(productosActuales);
            if (factorGradual > currentFactor) {
                console.log(`- Actualizando factor a: ${factorGradual}`);
                updateFirebaseFactor(factorGradual);
                setCurrentFactor(factorGradual);
            }
        } else if (hora < 21) {
            const nuevoFactor = calcularFactor(productosActuales);
            updateFirebaseFactor(nuevoFactor);
            setCurrentFactor(nuevoFactor);
        }
    }, [productosActuales, isActive, testHora, isTestMode, hasSetPrediction, currentFactor]);

    return (
        <div className="bg-black flex flex-col justify-center items-center rounded-3xl pb-4 pt-4">
            <div className="flex items-center justify-between w-full border-b border-gray-100 border-opacity-50 pb-4 px-4">
                <p className="text-gray-100 font-medium">Dynamic pricing</p>
                <Toggle
                    isOn={isActive}
                    onToggle={() => setIsActive(!isActive)}
                />
            </div>

            <div className="flex flex-col text-center mt-6">
                <p className="text-gray-100 font-bold text-6xl">
                    +{((currentFactor - 1) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-100 font-medium mb-1">
                    {(isTestMode ? testHora : new Date().getHours()) >= 21 && hasSetPrediction ? 'Valor predicho' : 'Valor exacto'}
                </p>
                <div className="text-xs text-gray-100 font-medium opacity-50">
                    Ventas: {productosActuales} / {VENTAS_MAXIMAS}
                </div>
            </div>

            {isActive && (
                <div className='px-4 w-full mt-4'>
                    <div className="w-full bg-gray-100 bg-opacity-50 rounded-full h-1 mt-4 mb-2 relative">
                        <div
                            className="bg-gray-100 h-1 rounded-full opacity-100 transition-all duration-500"
                            style={{ width: `${(productosActuales / VENTAS_MAXIMAS) * 100}%` }}
                        >
                            <div className="absolute right-[5px] w-[4px] h-[4px] bg-black z-50 rounded-full"></div>
                            <div className="absolute right-0 -top-[5px] w-3.5 h-3.5 bg-gray-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceFactor;