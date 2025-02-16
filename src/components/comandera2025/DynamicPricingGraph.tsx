import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const DynamicPricingGraph = () => {
    const [selectedStrategy, setSelectedStrategy] = useState('balanced');
    const [curveParams, setCurveParams] = useState({
        conservative: { power: 1.0, maxIncrease: 0.08 },
        balanced: { power: 0.8, maxIncrease: 0.11 },
        aggressive: { power: 0.6, maxIncrease: 0.15 }
    });

    const generateCurveData = (params) => {
        const points = [];
        const totalPoints = 250;

        for (let ventas = 0; ventas <= totalPoints; ventas += 10) {
            const porcentajeAvance = ventas / totalPoints;
            const factor = 1 + Math.pow(porcentajeAvance, params.power) * params.maxIncrease;
            points.push({
                ventas,
                factor: Math.ceil(factor * 100) / 100
            });
        }
        return points;
    };

    const strategies = {
        conservative: generateCurveData(curveParams.conservative),
        balanced: generateCurveData(curveParams.balanced),
        aggressive: generateCurveData(curveParams.aggressive)
    };

    const strategyLabels = {
        conservative: 'Conservadora',
        balanced: 'Equilibrada',
        aggressive: 'Agresiva'
    };

    const handlePowerChange = (strategy, value) => {
        setCurveParams(prev => ({
            ...prev,
            [strategy]: {
                ...prev[strategy],
                power: parseFloat(value)
            }
        }));
    };

    const handleMaxIncreaseChange = (strategy, value) => {
        setCurveParams(prev => ({
            ...prev,
            [strategy]: {
                ...prev[strategy],
                maxIncrease: parseFloat(value)
            }
        }));
    };

    const PowerControl = ({ strategy }) => (
        <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">
                    Exponente:
                </label>
                <span className="text-xs text-gray-400">
                    {curveParams[strategy].power.toFixed(2)}
                </span>
            </div>
            <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={curveParams[strategy].power}
                onChange={(e) => handlePowerChange(strategy, e.target.value)}
                className="w-full"
            />
        </div>
    );

    const MaxIncreaseControl = ({ strategy }) => (
        <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">
                    Incremento máximo:
                </label>
                <span className="text-xs text-gray-400">
                    {(curveParams[strategy].maxIncrease * 100).toFixed(1)}%
                </span>
            </div>
            <input
                type="range"
                min="0.01"
                max="0.3"
                step="0.01"
                value={curveParams[strategy].maxIncrease}
                onChange={(e) => handleMaxIncreaseChange(strategy, e.target.value)}
                className="w-full"
            />
        </div>
    );

    return (
        <div className="w-full px-4 mt-6">
            <div className="flex justify-between mb-4 gap-2">
                {Object.keys(strategies).map((strategy) => (
                    <button
                        key={strategy}
                        onClick={() => setSelectedStrategy(strategy)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedStrategy === strategy
                                ? 'bg-gray-100 text-black'
                                : 'bg-gray-800 text-gray-300'
                            }`}
                    >
                        {strategyLabels[strategy]}
                    </button>
                ))}
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-gray-100 font-medium mb-3">
                    Configuración de {strategyLabels[selectedStrategy].toLowerCase()}
                </h3>
                <div className="space-y-4">
                    <PowerControl strategy={selectedStrategy} />
                    <MaxIncreaseControl strategy={selectedStrategy} />
                </div>
            </div>

            <div className="w-full h-64 mt-2">
                <LineChart
                    width={500}
                    height={250}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    data={strategies[selectedStrategy]}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                        dataKey="ventas"
                        stroke="#666"
                        label={{ value: 'Productos vendidos', position: 'bottom', fill: '#666' }}
                    />
                    <YAxis
                        stroke="#666"
                        domain={[1, 1.3]}
                        tickFormatter={(value) => `${((value - 1) * 100).toFixed(0)}%`}
                        label={{ value: 'Incremento', angle: -90, position: 'left', fill: '#666' }}
                    />
                    <Tooltip
                        formatter={(value) => `+${((value - 1) * 100).toFixed(1)}%`}
                        labelFormatter={(value) => `${value} productos`}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#666' }}
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