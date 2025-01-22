import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const MaterialCostsBreakdown = ({ materiaPrima, facturacionTotal, neto }) => {
    const [materials, setMaterials] = useState([]);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await window.fs.readFile('materiales');
                const materialsData = JSON.parse(response);
                setMaterials(materialsData);
            } catch (error) {
                console.error('Error fetching materials:', error);
            }
        };

        fetchMaterials();
    }, []);

    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-4">
                <div className="text-sm font-medium">Cálculo base:</div>
                <div className="ml-4 text-sm">
                    <div>Facturación total: $ {facturacionTotal.toFixed(0)}</div>
                    <div>Neto: $ {neto.toFixed(0)}</div>
                    <div>Materia prima total: $ {materiaPrima.toFixed(0)}</div>
                </div>
            </div>

            <div className="text-sm font-medium mb-2">Desglose de materiales:</div>
            <div className="space-y-2">
                {materials.map((material, index) => (
                    <div
                        key={index}
                        className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center"
                    >
                        <div>
                            <span className="font-medium">{material.nombre}</span>
                            <span className="text-gray-500 ml-2">({material.unit})</span>
                        </div>
                        <div className="text-right">
                            <div>Stock: {material.stock.toFixed(2)} {material.unit}</div>
                            <div>Costo: ${material.costo} por {material.unidadPorPrecio} {material.unit}</div>
                            <div className="text-xs text-gray-500">
                                Costo unitario: ${(material.costo / material.unidadPorPrecio).toFixed(2)} por {material.unit}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-xs text-gray-500">
                * Los costos mostrados son los registrados en el sistema. Verificar regularmente para mantener actualizado.
            </div>
        </div>
    );
};

export default MaterialCostsBreakdown;