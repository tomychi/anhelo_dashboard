import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

interface DynamicPricingGraphProps {
  activeStrategy: string;
  setActiveStrategy: (strategy: string) => void;
  ventasMaximas: number;
}

const DynamicPricingGraph: React.FC<DynamicPricingGraphProps> = ({
  activeStrategy,
  setActiveStrategy,
  ventasMaximas,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [curveParams, setCurveParams] = useState({
    conservative: { power: 1.0, maxIncrease: 0.08 },
    balanced: { power: 0.8, maxIncrease: 0.11 },
    aggressive: { power: 0.6, maxIncrease: 0.15 },
  });

  useEffect(() => {
    loadStrategiesFromFirestore();
  }, []);

  const loadStrategiesFromFirestore = async () => {
    try {
      const firestore = getFirestore();
      const docRef = doc(firestore, "constantes", "altaDemanda");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().pricingStrategies) {
        setCurveParams(docSnap.data().pricingStrategies);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading strategies:", error);
      setIsLoading(false);
    }
  };

  const updateStrategyInFirestore = async (
    strategy: string,
    newParams: any
  ) => {
    try {
      const firestore = getFirestore();
      const docRef = doc(firestore, "constantes", "altaDemanda");

      await updateDoc(docRef, {
        [`pricingStrategies.${strategy}`]: newParams,
      });
    } catch (error) {
      console.error("Error updating strategy:", error);
    }
  };

  const updateActiveStrategy = async (strategy: string) => {
    try {
      const firestore = getFirestore();
      const docRef = doc(firestore, "constantes", "altaDemanda");

      await updateDoc(docRef, {
        activeStrategy: strategy,
      });
      setActiveStrategy(strategy);
    } catch (error) {
      console.error("Error updating active strategy:", error);
    }
  };

  const generateCurveData = (params: any) => {
    const points = [];
    const totalPoints = ventasMaximas; // Usamos el valor dinámico

    for (let ventas = 0; ventas <= totalPoints; ventas += 10) {
      const porcentajeAvance = ventas / totalPoints;
      const factor =
        1 + Math.pow(porcentajeAvance, params.power) * params.maxIncrease;
      points.push({
        ventas,
        factor: Math.ceil(factor * 100) / 100,
      });
    }
    return points;
  };

  const getStrategyLabel = (strategyId: string) => {
    const labels = {
      conservative: "Conservadora",
      balanced: "Equilibrada",
      aggressive: "Agresiva",
    };
    return labels[strategyId];
  };

  const handlePowerChange = async (strategy: string, value: string) => {
    const newParams = {
      ...curveParams[strategy],
      power: parseFloat(value),
    };

    setCurveParams((prev) => ({
      ...prev,
      [strategy]: newParams,
    }));

    await updateStrategyInFirestore(strategy, newParams);
  };

  const handleMaxIncreaseChange = async (strategy: string, value: string) => {
    const newParams = {
      ...curveParams[strategy],
      maxIncrease: parseFloat(value),
    };

    setCurveParams((prev) => ({
      ...prev,
      [strategy]: newParams,
    }));

    await updateStrategyInFirestore(strategy, newParams);
  };

  const strategies = {
    conservative: generateCurveData(curveParams.conservative),
    balanced: generateCurveData(curveParams.balanced),
    aggressive: generateCurveData(curveParams.aggressive),
  };

  if (isLoading) {
    return (
      <div className="text-gray-400 text-center py-4">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="w-full px-4 mt-6">
      <div className="flex justify-between mb-4 gap-2">
        {Object.keys(strategies).map((strategy) => (
          <button
            key={strategy}
            onClick={() => updateActiveStrategy(strategy)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeStrategy === strategy
                ? "bg-gray-100 text-black"
                : "bg-gray-800 text-gray-200 "
            }`}
          >
            {getStrategyLabel(strategy)}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-gray-100 font-medium mb-3">
          Configuración {getStrategyLabel(activeStrategy).toLowerCase()}
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Exponente:</label>
              <span className="text-xs text-gray-400">
                {curveParams[activeStrategy].power.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={curveParams[activeStrategy].power}
              onChange={(e) =>
                handlePowerChange(activeStrategy, e.target.value)
              }
              className="w-full"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">
                Incremento máximo:
              </label>
              <span className="text-xs text-gray-400">
                {(curveParams[activeStrategy].maxIncrease * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.3"
              step="0.01"
              value={curveParams[activeStrategy].maxIncrease}
              onChange={(e) =>
                handleMaxIncreaseChange(activeStrategy, e.target.value)
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-64 mt-2">
        <LineChart
          width={314}
          height={250}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          data={strategies[activeStrategy]}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="ventas"
            stroke="#666"
            label={{
              value: "Productos vendidos",
              position: "bottom",
              fill: "#666",
            }}
          />
          <YAxis
            stroke="#666"
            domain={[1, 1.3]}
            tickFormatter={(value) => `${((value - 1) * 100).toFixed(0)}%`}
            label={{
              value: "Incremento",
              angle: -90,
              position: "left",
              fill: "#666",
            }}
          />
          <Tooltip
            formatter={(value) => `+${((value - 1) * 100).toFixed(1)}%`}
            labelFormatter={(value) => `${value} productos`}
            contentStyle={{ backgroundColor: "#1a1a1a", border: "none" }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#666" }}
          />
          <Line
            type="monotone"
            dataKey="factor"
            stroke="#fff"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </div>
    </div>
  );
};

export default DynamicPricingGraph;
