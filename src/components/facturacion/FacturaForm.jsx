import { useState, useEffect } from 'react';
import SalesCards from './SalesCards';
import { listenToUninvoicedOrders } from '../../firebase/UploadOrder';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';

const FacturaForm = ({ backendStatus }) => {
    const [respuesta, setRespuesta] = useState(null);
    const [error, setError] = useState(null);
    const [tokenStatus, setTokenStatus] = useState(null);
    const [isLoadingToken, setIsLoadingToken] = useState(false);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const [formData, setFormData] = useState({
        cuit: '',
        puntoVenta: '',
        tipoFactura: '',
        importeNeto: '',
        importeTrib: '',
        importeTotal: ''
    });
    const [ventasSinFacturar, setVentasSinFacturar] = useState([]);

    useEffect(() => {
        const unsubscribe = listenToUninvoicedOrders(
            (pedidos) => setVentasSinFacturar(pedidos),
            (errMsg) => setError(errMsg)
        );
        return () => unsubscribe();
    }, []);

    const checkTokenStatus = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/afip/token/status');
            const data = await response.json();
            if (data.success) {
                setTokenStatus(data.data);
            }
        } catch (error) {
            console.error('Error al verificar token:', error);
        }
    };

    useEffect(() => {
        checkTokenStatus();
        const interval = setInterval(checkTokenStatus, 300000);
        return () => clearInterval(interval);
    }, []);

    const handleGenerateToken = async () => {
        setIsLoadingToken(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/afip/token/generate', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                await checkTokenStatus();
            } else {
                setError('Error al generar token: ' + data.message);
            }
        } catch (error) {
            setError('Error de conexión al generar token');
        } finally {
            setIsLoadingToken(false);
        }
    };

    const calcularImportes = (total, trib) => {
        const totalNumero = parseFloat(total) || 0;
        const tribNumero = parseFloat(trib) || 0;
        const neto = (totalNumero - tribNumero) / 1.21;
        setFormData(prev => ({
            ...prev,
            importeNeto: neto.toFixed(2),
            importeTrib: tribNumero.toFixed(2),
            importeTotal: totalNumero.toFixed(2)
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'importeTotal' || name === 'importeTrib') {
            const newTotal = name === 'importeTotal' ? value : formData.importeTotal;
            const newTrib = name === 'importeTrib' ? value : formData.importeTrib;
            calcularImportes(newTotal, newTrib);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmitSingle = async (e) => {
        e.preventDefault();
        setError(null);
        setRespuesta(null);
        try {
            const response = await fetch('http://localhost:3000/api/afip/factura', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success && data.data.resultado === 'A') {
                setRespuesta({
                    cae: data.data.cae,
                    fechaVencimiento: data.data.caeFchVto,
                    cbteDesde: data.data.cbteDesde,
                    cbteHasta: data.data.cbteHasta
                });
            } else {
                const errorMsg = Array.isArray(data.data?.errores)
                    ? data.data.errores.map(err => err.Msg).join(', ')
                    : data.data?.errores?.Msg || data.data?.observaciones?.Msg || data.message || 'Error desconocido';
                setError(errorMsg);
            }
        } catch (error) {
            setError('Error de conexión con el servidor');
        }
    };

    const updateSeFacturoInFirestore = async (pedidosToUpdate) => {
        const firestore = getFirestore();
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const docRef = doc(firestore, `pedidos/${year}/${month}/${day}`);

        try {
            await runTransaction(firestore, async (transaction) => {
                const docSnapshot = await transaction.get(docRef);
                if (!docSnapshot.exists()) {
                    throw new Error('El documento de pedidos no existe para hoy');
                }

                const existingData = docSnapshot.data();
                const pedidosDelDia = existingData.pedidos || [];

                const pedidosActualizados = pedidosDelDia.map((pedido) => {
                    const shouldUpdate = pedidosToUpdate.some(p => p.id === pedido.id);
                    if (shouldUpdate) {
                        return { ...pedido, seFacturo: true };
                    }
                    return pedido;
                });

                transaction.set(docRef, {
                    ...existingData,
                    pedidos: pedidosActualizados,
                });
            });
            console.log('Pedidos marcados como facturados en Firestore');
        } catch (error) {
            throw new Error('Error al actualizar seFacturo en Firestore: ' + error.message);
        }
    };

    const handleSubmitMultiple = async (e) => {
        e.preventDefault();
        setError(null);
        setRespuesta(null);
        setIsLoadingSubmit(true);

        try {
            const ventasAFacturar = ventasSinFacturar.filter(venta => venta.quiereFacturarla);
            if (ventasAFacturar.length === 0) {
                setError('No hay ventas seleccionadas para facturar');
                return;
            }

            // Paso 1: Preparar y enviar al backend
            const multipleFacturas = ventasAFacturar.map(venta => ({
                cuit: formData.cuit,
                puntoVenta: formData.puntoVenta,
                tipoFactura: formData.tipoFactura,
                importeNeto: venta.importeNeto,
                importeTrib: venta.importeTrib,
                importeTotal: venta.importeTotal
            }));
            console.log('Ventas a facturar:', multipleFacturas);

            const response = await fetch('http://localhost:3000/api/afip/factura/multiple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facturas: multipleFacturas })
            });
            const data = await response.json();

            if (data.success) {
                // Paso 2: Identificar facturas exitosas y actualizar Firestore solo para ellas
                const facturasGeneradas = Array.isArray(data.data) ? data.data : [];
                const pedidosExitosos = ventasAFacturar.filter((venta, index) =>
                    facturasGeneradas[index]?.cae && facturasGeneradas[index].cae !== 'No generado'
                );

                if (pedidosExitosos.length > 0) {
                    await updateSeFacturoInFirestore(pedidosExitosos);
                }

                // Mostrar resultados (éxitos y fallos)
                setRespuesta(data.data);

                // Si hay fallos, mostrar mensaje
                const facturasFallidas = facturasGeneradas.filter(f => !f.cae || f.cae === 'No generado');
                if (facturasFallidas.length > 0) {
                    setError('Algunas facturas no se generaron correctamente');
                }
            } else {
                setError(data.message || 'Error al procesar las facturas en el backend');
            }
        } catch (error) {
            setError(error.message || 'Error de conexión con el servidor');
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    const handleToggleFacturar = (ventaId) => {
        setVentasSinFacturar(prevVentas => prevVentas.map(venta =>
            venta.id === ventaId ? { ...venta, quiereFacturarla: !venta.quiereFacturarla } : venta
        ));
    };

    return (
        <>
            <style>{`select:invalid { color: #9CA3AF; }`}</style>
            <div className="font-coolvetica flex flex-col items-center justify-center w-full bg-gray-50">
                <div className="py-6 my-auto">
                    <div className="flex flex-row justify-center items-center gap-2">
                        {tokenStatus?.valid ? (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                        ) : (
                            <span className="relative flex h-3 w-3">
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                            </span>
                        )}
                        <h2 className="text-3xl font-bold text-black text-center">
                            {tokenStatus?.valid ? 'Conectado' : (
                                <button
                                    onClick={handleGenerateToken}
                                    disabled={isLoadingToken}
                                    className="text-5xl font-bold text-black text-center"
                                >
                                    {isLoadingToken ? 'Conectando' : 'Conectar'}
                                </button>
                            )}
                        </h2>
                    </div>
                    <p className="text-gray-400 text-center text-xs">{backendStatus}.</p>
                </div>

                <SalesCards ventas={ventasSinFacturar} onToggleFacturar={handleToggleFacturar} />

                <div className='w-full px-4'>
                    <button
                        onClick={handleSubmitMultiple}
                        disabled={!tokenStatus?.valid || isLoadingSubmit}
                        className="w-full bg-black h-20 mt-4 flex flex-row items-center justify-center gap-2 rounded-3xl"
                    >
                        <p className='text-center items-center flex justify-center w-4 h-4 bg-gray-50 rounded-full text-[10px] font-bold'>
                            {ventasSinFacturar.filter(venta => venta.quiereFacturarla).length}
                        </p>
                        <p className="text-gray-100 font-bold text-3xl">
                            {isLoadingSubmit ? 'Enviando...' : 'Enviar'}
                        </p>
                    </button>
                </div>

                <form onSubmit={handleSubmitSingle} className="px-4 mt-8 w-full max-w-md">
                    <select
                        name="tipoFactura"
                        value={formData.tipoFactura}
                        onChange={handleChange}
                        className="w-full text-black bg-transparent text-xs border-gray-300 h-10 px-4 rounded-t-3xl border-x border-t border-black transition-all appearance-none"
                        required
                    >
                        <option value="" disabled selected>Tipo de Factura</option>
                        <option value="A">Factura A</option>
                        <option value="B">Factura B</option>
                        <option value="C">Factura C</option>
                    </select>
                    <input
                        type="text"
                        name="cuit"
                        value={formData.cuit}
                        onChange={handleChange}
                        className="w-full text-black bg-transparent text-xs border-gray-300 h-10 px-4 border-x border-t transition-all"
                        readOnly
                        placeholder="CUIT Emisor"
                    />
                    <input
                        type="number"
                        name="puntoVenta"
                        value={formData.puntoVenta}
                        onChange={handleChange}
                        className="w-full text-black text-xs bg-transparent h-10 border-gray-300 px-4 border-x border-t transition-all"
                        required
                        placeholder="Punto de Venta"
                    />
                    <input
                        type="number"
                        name="importeTrib"
                        value={formData.importeTrib}
                        onChange={handleChange}
                        className="w-full text-black h-10 px-4 bg-transparent text-xs border-x border-t border-gray-300 transition-all"
                        step="0.01"
                        min="0"
                        placeholder="Tasa Municipal"
                    />
                    <input
                        type="number"
                        name="importeTotal"
                        value={formData.importeTotal}
                        onChange={handleChange}
                        className="w-full border-gray-300 bg-transparent text-black text-xs border-x border-t h-10 px-4 transition-all"
                        step="0.01"
                        min="0"
                        required
                        placeholder="Importe Total"
                    />
                    <input
                        type="number"
                        name="importeNeto"
                        value={formData.importeNeto}
                        className="w-full border-gray-300 bg-transparent text-black text-xs border-x border-b border-t h-10 px-4 rounded-b-3xl"
                        readOnly
                        placeholder="Importe Neto"
                    />
                    <button
                        type="submit"
                        disabled={!tokenStatus?.valid}
                        className="w-full bg-black h-20 mb-8 mt-4 rounded-3xl"
                    >
                        <p className="text-gray-100 font-bold text-3xl">Factura individual</p>
                    </button>
                </form>

                {error && (
                    <div className="mt-6 rounded-lg p-4 border-l-4 border-red-500/50">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
                {respuesta && (
                    <div className="mt-6 rounded-lg p-4 border-l-4 border-black/50">
                        <h3 className="text-black text-sm font-light mb-2">Facturas Generadas</h3>
                        {Array.isArray(respuesta) ? (
                            respuesta.map((resp, index) => (
                                <div key={index} className="space-y-1 text-gray-700 text-sm">
                                    <p>Factura {index + 1}:</p>
                                    <p>CAE: <span className="text-black font-mono">{resp.cae || 'No generado'}</span></p>
                                    <p>Vencimiento: <span className="text-black font-mono">{resp.caeFchVto || 'N/A'}</span></p>
                                    <p>Número: <span className="text-black font-mono">{resp.cbteDesde}</span></p>
                                    {resp.errores && (
                                        <p className="text-red-400">Error: {Array.isArray(resp.errores) ? resp.errores.map(e => e.Msg).join(', ') : resp.errores.Msg}</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="space-y-1 text-gray-700 text-sm">
                                <p>CAE: <span className="text-black font-mono">{respuesta.cae}</span></p>
                                <p>Vencimiento: <span className="text-black font-mono">{respuesta.caeFchVto}</span></p>
                                <p>Número: <span className="text-black font-mono">{respuesta.cbteDesde}</span></p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default FacturaForm;