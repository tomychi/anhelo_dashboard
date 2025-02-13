import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';

const VENTAS_MAXIMAS = 250;

const Toggle = ({ isOn, onToggle }) => (
    <div
        className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer bg-gray-300 ${isOn ? "" : " bg-opacity-40"
            }`}
        onClick={onToggle}
    >
        <div
            className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? "translate-x-6" : ""
                }`}
        />
    </div>
);

const PriceFactor = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentFactor, setCurrentFactor] = useState(1.0);

    const { totalProductosVendidos } = useSelector((state: RootState) => state.data);

    const calcularFactor = (ventas: number) => {
        const porcentajeAvance = ventas / VENTAS_MAXIMAS;
        const factorIncremento = Math.pow(porcentajeAvance, 0.8) * 0.11;
        return Math.ceil((1 + factorIncremento) * 100) / 100;
    };

    useEffect(() => {
        if (!isActive) {
            setCurrentFactor(1.0);
            return;
        }

        const nuevoFactor = calcularFactor(totalProductosVendidos);
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

        updateFirebaseFactor();
    }, [totalProductosVendidos, isActive]);

    return (
        <div className="bg-black  flex flex-col justify-center items-center rounded-3xl pb-8 pt-4 px-4">
            <div className="flex items-center justify-between w-full mb-4">
                <p className="text-gray-100 text-sm font-bold ">Dynamic pricing</p>
                <Toggle
                    isOn={isActive}
                    onToggle={() => setIsActive(!isActive)}
                />
            </div>

            <div className=" flex flex-col text-center ">
                <p className="text-gray-100  font-bold text-5xl">
                    +{((currentFactor - 1) * 100).toFixed(1)}%
                </p>
                <div className="text-sm text-gray-100 opacity-50">
                    Ventas: {totalProductosVendidos} / {VENTAS_MAXIMAS}
                </div>
            </div>

            {isActive && (
                <div className="w-full bg-gray-100 bg-opacity-50  rounded-full h-1 mt-4 relative">
                    <div
                        className="bg-gray-100 h-1 rounded-full opacity-100 transition-all duration-500"
                        style={{ width: `${(totalProductosVendidos / VENTAS_MAXIMAS) * 100}%` }}
                    >
                        <div className="absolute right-[5px]  w-[4px] h-[4px] bg-black z-50 rounded-full"></div>
                        <div className="absolute right-0 -top-[5px] w-3.5 h-3.5 bg-gray-500   rounded-full"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceFactor;