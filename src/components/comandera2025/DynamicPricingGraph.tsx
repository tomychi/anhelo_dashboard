import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const DynamicPricingGraph = () => {
    const [selectedStrategy, setSelectedStrategy] = useState('balanced');

    // Generate data points for different strategies
    const generateCurveData = (strategy) => {
        const points = [];
        const totalPoints = 250; // VENTAS_MAXIMAS

        for (let ventas = 0; ventas <= totalPoints; ventas += 10) {
            const porcentajeAvance = ventas / totalPoints;
            let factor;

            switch (strategy) {
                case 'aggressive':
                    factor = 1 + Math.pow(porcentajeAvance, 0.6) * 0.15; // More steep curve
                    break;
                case 'conservative':
                    factor = 1 + Math.pow(porcentajeAvance, 1.0) * 0.08; // More gentle curve
                    break;
                default: // balanced - current implementation
                    factor = 1 + Math.pow(porcentajeAvance, 0.8) * 0.11;
            }

            points.push({
                ventas,
                factor: Math.ceil(factor * 100) / 100
            });
        }
        return points;
    };

    const strategies = {
        conservative: generateCurveData('conservative'),
        balanced: generateCurveData('balanced'),
        aggressive: generateCurveData('aggressive')
    };

    const strategyLabels = {
        conservative: 'Conservadora',
        balanced: 'Equilibrada',
        aggressive: 'Agresiva'
    };

    const strategyDescriptions = {
        conservative: 'Incrementos suaves para minimizar impacto en ventas',
        balanced: 'Configuración actual balanceada',
        aggressive: 'Maximiza ingresos en momentos de alta demanda'
    };

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

            <p className="text-gray-400 text-sm mb-4">
                {strategyDescriptions[selectedStrategy]}
            </p>

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
                        domain={[1, 1.2]}
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