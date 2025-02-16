import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import DynamicPricingGraph from './DynamicPricingGraph';

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
    const [activeStrategy, setActiveStrategy] = useState('balanced');
    const [pricingStrategies, setPricingStrategies] = useState({
        conservative: { power: 1.0, maxIncrease: 0.08 },
        balanced: { power: 0.8, maxIncrease: 0.11 },
        aggressive: { power: 0.6, maxIncrease: 0.15 }
    });
    const [showTestPanel, setShowTestPanel] = useState(false);

    // 2. useSelector después de todos los useState
    const totalProductosVendidos = useSelector((state: RootState) => state.data.totalProductosVendidos ?? 0);

    // 3. Variables derivadas
    const productosActuales = isTestMode ? testProductos : totalProductosVendidos;

    // 4. Funciones
    const calcularFactor = (ventas: number) => {
        console.log('\n📊 Calculando factor:');
        console.log(`- Ventas actuales: ${ventas}`);
        console.log(`- Estrategia activa: ${activeStrategy}`);

        const porcentajeAvance = ventas / VENTAS_MAXIMAS;
        console.log(`- Porcentaje de avance: ${(porcentajeAvance * 100).toFixed(1)}%`);

        // Verificar que tenemos la estrategia correcta
        if (!pricingStrategies[activeStrategy]) {
            console.error(`❌ Estrategia ${activeStrategy} no encontrada:`, pricingStrategies);
            return 1.0;
        }

        const currentStrategy = pricingStrategies[activeStrategy];
        console.log('- Estrategia completa:', currentStrategy);
        console.log(`- Power: ${currentStrategy.power}`);
        console.log(`- MaxIncrease: ${currentStrategy.maxIncrease}`);

        const factorIncremento = Math.pow(porcentajeAvance, currentStrategy.power) * currentStrategy.maxIncrease;
        console.log(`- Factor incremento: ${(factorIncremento * 100).toFixed(2)}%`);

        const factorFinal = Math.ceil((1 + factorIncremento) * 100) / 100;
        console.log(`- Factor final: ${factorFinal} (+${((factorFinal - 1) * 100).toFixed(1)}%)`);

        return factorFinal;
    };

    const loadStrategiesFromFirestore = async () => {
        try {
            const firestore = getFirestore();
            const docRef = doc(firestore, 'constantes', 'altaDemanda');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.pricingStrategies) {
                    setPricingStrategies(data.pricingStrategies);
                }
                if (data.activeStrategy) {
                    setActiveStrategy(data.activeStrategy);
                }
            }
        } catch (error) {
            console.error('Error loading strategies:', error);
        }
    };

    useEffect(() => {
        loadStrategiesFromFirestore();
    }, []);

    const predecirFactor = (productosEnPrimeraHora: number) => {
        console.log('\n🎯 Prediciendo factor:');
        console.log(`- Productos acumulados: ${productosEnPrimeraHora}`);
        console.log(`- Estrategia activa: ${activeStrategy}`);

        const currentStrategy = pricingStrategies[activeStrategy];
        console.log(`- MaxIncrease: ${currentStrategy.maxIncrease}`);

        // Modificamos los thresholds basándonos en el total acumulado
        let porcentajeDelMax;
        if (productosEnPrimeraHora >= 50) {
            porcentajeDelMax = 1; // 100% del maxIncrease
        } else if (productosEnPrimeraHora >= 30) {
            porcentajeDelMax = 0.8; // 80% del maxIncrease
        } else if (productosEnPrimeraHora >= 20) {
            porcentajeDelMax = 0.6; // 60% del maxIncrease
        } else {
            porcentajeDelMax = 0.5; // 50% del maxIncrease
        }

        const incremento = currentStrategy.maxIncrease * porcentajeDelMax;
        const factorFinal = Math.ceil((1 + incremento) * 100) / 100;

        console.log(`- Porcentaje del máximo: ${(porcentajeDelMax * 100).toFixed(0)}%`);
        console.log(`- Incremento calculado: ${(incremento * 100).toFixed(1)}%`);
        console.log(`- Factor final: ${factorFinal} (+${((factorFinal - 1) * 100).toFixed(1)}%)`);

        return factorFinal;
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

    useEffect(() => {
        if (!isActive) {
            updateFirebaseFactor(1.0);
            setCurrentFactor(1.0);
            setHasSetPrediction(false);
            return;
        }

        const hora = isTestMode ? testHora : new Date().getHours();

        console.log('\n⚡ Inicio del efecto:');
        console.log(`- Hora actual: ${hora}:00`);
        console.log(`- HasSetPrediction: ${hasSetPrediction}`);
        console.log(`- Factor actual: ${currentFactor}`);
        console.log(`- Productos vendidos: ${productosActuales}`);

        // Reset prediction flag when hour changes before 21:00
        if (hora < 21 && hasSetPrediction) {
            console.log('🔄 Reseteando predicción (antes de las 21:00)');
            setHasSetPrediction(false);
        }

        // Before 21:00 - Normal calculation
        if (hora < 21) {
            console.log('📊 Modo pre-predicción');
            const nuevoFactor = calcularFactor(productosActuales);
            updateFirebaseFactor(nuevoFactor);
            setCurrentFactor(nuevoFactor);
        }
        // At 21:00 - Make prediction
        else if (hora === 21 && !hasSetPrediction) {
            console.log('🎯 Momento de predicción (21:00)');
            const factorPredicho = predecirFactor(productosActuales);
            console.log(`- Factor predicho: ${factorPredicho}`);
            updateFirebaseFactor(factorPredicho);
            setCurrentFactor(factorPredicho);
            setHasSetPrediction(true);
        }
        // After 21:00 - Only increase if exceeds prediction
        else if (hora >= 21 && hasSetPrediction) {
            console.log('📈 Modo post-predicción');
            const factorCalculado = calcularFactor(productosActuales);
            console.log(`- Factor calculado: ${factorCalculado}`);
            console.log(`- Factor predicho actual: ${currentFactor}`);

            if (factorCalculado > currentFactor) {
                console.log(`- Actualizando a nuevo factor: ${factorCalculado}`);
                updateFirebaseFactor(factorCalculado);
                setCurrentFactor(factorCalculado);
            } else {
                console.log('- Manteniendo factor predicho');
            }
        }
    }, [productosActuales, isActive, testHora, isTestMode, hasSetPrediction, currentFactor, activeStrategy, pricingStrategies]);

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
            <DynamicPricingGraph
                activeStrategy={activeStrategy}
                setActiveStrategy={setActiveStrategy}
            />

            {/* Panel de pruebas */}
            <div className="w-full px-4 mt-6">
                <button
                    onClick={() => setShowTestPanel(!showTestPanel)}
                    className="w-full py-2 bg-gray-800 rounded-lg text-gray-300 text-sm font-medium"
                >
                    {showTestPanel ? 'Ocultar panel de pruebas' : 'Mostrar panel de pruebas'}
                </button>

                {showTestPanel && (
                    <div className="mt-4 bg-gray-800 rounded-lg p-4">
                        <h3 className="text-gray-100 font-medium mb-4">Panel de pruebas</h3>

                        <div className="space-y-4">
                            {/* Control de modo test */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Modo test</span>
                                <Toggle
                                    isOn={isTestMode}
                                    onToggle={() => setIsTestMode(!isTestMode)}
                                />
                            </div>

                            {/* Controles de test */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">
                                        Productos vendidos: {testProductos}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max={VENTAS_MAXIMAS}
                                        value={testProductos}
                                        onChange={(e) => setTestProductos(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">
                                        Hora: {testHora}:00
                                    </label>
                                    <input
                                        type="range"
                                        min="19"
                                        max="23"
                                        value={testHora}
                                        onChange={(e) => setTestHora(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Casos de prueba predefinidos */}
                            <div className="pt-2 border-t border-gray-700">
                                <h4 className="text-gray-300 text-sm mb-2">Casos de prueba</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setIsTestMode(true);
                                            setTestHora(20);
                                            setTestProductos(5);
                                            setIsActive(true);
                                            setHasSetPrediction(false);
                                        }}
                                        className="px-3 py-2 bg-gray-700 rounded text-sm text-gray-300"
                                    >
                                        Baja demanda
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsTestMode(true);
                                            setTestHora(20);
                                            setTestProductos(30);
                                            setIsActive(true);
                                            setHasSetPrediction(false);
                                        }}
                                        className="px-3 py-2 bg-gray-700 rounded text-sm text-gray-300"
                                    >
                                        Alta demanda
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsTestMode(true);
                                            setTestHora(21);
                                            setIsActive(true);
                                            setHasSetPrediction(false);
                                        }}
                                        className="px-3 py-2 bg-gray-700 rounded text-sm text-gray-300"
                                    >
                                        Predicción 21:00
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsTestMode(true);
                                            setTestHora(22);
                                            setTestProductos(100);
                                            setIsActive(true);
                                            setHasSetPrediction(true);
                                        }}
                                        className="px-3 py-2 bg-gray-700 rounded text-sm text-gray-300"
                                    >
                                        Post predicción
                                    </button>
                                </div>

                                {/* Estado actual */}
                                <div className="mt-4 p-3 bg-gray-900 rounded-lg text-xs text-gray-400 font-mono">
                                    <div>isActive: {isActive.toString()}</div>
                                    <div>hasSetPrediction: {hasSetPrediction.toString()}</div>
                                    <div>hora: {testHora}:00</div>
                                    <div>productos: {testProductos}</div>
                                    <div>factor: {currentFactor}</div>
                                    <div>estrategia: {activeStrategy}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceFactor;