import { useState, useEffect } from 'react';
import SalesCards from './SalesCards';
import { listenToUninvoicedOrders } from '../../firebase/UploadOrder';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
import LoadingPoints from '../LoadingPoints';

const FacturaForm = () => {
    const [respuesta, setRespuesta] = useState(null);
    const [error, setError] = useState(null);
    const [tokenStatus, setTokenStatus] = useState(null);
    const [isLoadingToken, setIsLoadingToken] = useState(false);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const [showIndividualForm, setShowIndividualForm] = useState(false);
    const [formData, setFormData] = useState({
        // cuit: '',
        // puntoVenta: '',
        // tipoFactura: '',
        // importeNeto: '',
        // importeTrib: '',
        // importeTotal: ''
        cuit: '33718835289',
        puntoVenta: '2',
        tipoFactura: 'B',
        importeNeto: '0.00',
        importeTrib: '0.00',
        importeTotal: '0.00'
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

    const toggleIndividualForm = () => {
        setShowIndividualForm(!showIndividualForm);
    };

    const copyResultsToClipboard = () => {
        let textToCopy = '';

        if (Array.isArray(respuesta)) {
            // Si es un array de resultados (múltiples facturas)
            textToCopy = respuesta.map((resp, index) => {
                return `FACTURA ${index + 1}:\n` +
                    `CAE: ${resp.cae || 'No generado'}\n` +
                    `Vencimiento: ${resp.caeFchVto || 'N/A'}\n` +
                    `Comprobante número: ${resp.cbteDesde}\n` +
                    (resp.errores ? `Error: ${Array.isArray(resp.errores) ?
                        resp.errores.map(e => e.Msg).join(', ') :
                        resp.errores.Msg}\n` : '') +
                    '------------------------\n';
            }).join('\n');
        } else {
            // Si es un solo resultado (factura individual)
            textToCopy = `CAE: ${respuesta.cae}\n` +
                `Vencimiento: ${respuesta.fechaVencimiento || respuesta.caeFchVto}\n` +
                `Número: ${respuesta.cbteDesde}`;
        }

        // Copiar al portapapeles
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Opcional: mostrar feedback de éxito
                alert('Resultados copiados al portapapeles');
            })
            .catch(err => {
                console.error('Error al copiar: ', err);
                // Feedback alternativo si falla
                alert('No se pudo copiar al portapapeles. Error: ' + err);
            });
    };

    return (
        <>
            <style>{`select:invalid { color: #9CA3AF; }`}</style>
            <div className="font-coolvetica flex flex-col items-center justify-center w-full ">

                {/* header */}
                <div className="py-8 flex flex-row justify-between px-4 w-full items-baseline">
                    {/* titulo */}
                    <div className='flex flex-col'>
                        <h2 className='text-3xl font-bold'>Facturacion</h2>
                        {/* conectado */}
                        <div className="flex flex-row items-center gap-1">
                            {tokenStatus?.valid ? (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            ) : (
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                                </span>
                            )}
                            <h2 className="text-xs  font-bold text-gray-400 ">
                                {tokenStatus?.valid ? 'Conectado' : (
                                    <button
                                        onClick={handleGenerateToken}
                                        disabled={isLoadingToken}
                                        className=" font-bold "
                                    >
                                        {isLoadingToken ? 'Conectando' : 'Conectar'}
                                    </button>
                                )}
                            </h2>
                        </div>
                        {ventasSinFacturar.length === 0 ? (
                            <div className='flex flex-row gap-1 -ml-[1.2px]  items-center '>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-2.5 text-green-500">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
                                </svg>
                                <p className="font-bold text-gray-400 text-xs">
                                    Estas al dia con tus facturas
                                </p>
                            </div>
                        ) : null}
                    </div>
                    {/* individual */}
                    <button
                        onClick={toggleIndividualForm}
                        className="bg-gray-300 gap-2 text-black rounded-full flex items-center py-4 pl-3 pr-4 h-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
                            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                        </svg>
                        <p>
                            {showIndividualForm ? 'Ocultar' : ' Individual'}
                        </p>
                    </button>
                </div>

                {/* Facturacion multiple */}
                <div className='w-full px-4'>
                    {ventasSinFacturar.length > 0 ? (
                        <div className='flex flex-col'>
                            <SalesCards ventas={ventasSinFacturar} onToggleFacturar={handleToggleFacturar} />

                            <button
                                onClick={handleSubmitMultiple}
                                disabled={!tokenStatus?.valid || isLoadingSubmit}
                                className="w-full bg-black h-20 mt-4 flex items-center justify-center rounded-3xl"
                            >
                                <p className="text-gray-100 font-bold text-3xl">
                                    {isLoadingSubmit ? <LoadingPoints color="text-gray-100" /> :
                                        <div className='flex flex-row items-center justify-center gap-2'>
                                            <p className='text-center flex justify-center w-4 h-4 bg-gray-50 rounded-full text-[10px] font-bold text-black items-center'>
                                                {ventasSinFacturar.filter(venta => venta.quiereFacturarla).length}
                                            </p>
                                            Enviar
                                        </div>
                                    }
                                </p>
                            </button>
                        </div>
                    ) : (
                        null
                    )}
                </div>

                {/* Facturacion individual */}
                {showIndividualForm && (
                    <form onSubmit={handleSubmitSingle} className="px-4  w-full">
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
                            className="w-full text-black bg-transparent rounded-none text-xs border-gray-300 h-10 px-4 border-x border-t transition-all"
                            readOnly
                            placeholder="CUIT Emisor"
                        />
                        <input
                            type="number"
                            name="puntoVenta"
                            value={formData.puntoVenta}
                            onChange={handleChange}
                            className="w-full text-black text-xs rounded-none bg-transparent h-10 border-gray-300 px-4 border-x border-t transition-all"
                            required
                            placeholder="Punto de Venta"
                        />
                        <input
                            type="number"
                            name="importeTrib"
                            value={formData.importeTrib}
                            onChange={handleChange}
                            className="w-full text-black h-10 px-4 rounded-none bg-transparent text-xs border-x border-t border-gray-300 transition-all"
                            step="0.01"
                            min="0"
                            placeholder="Tasa Municipal"
                        />
                        <input
                            type="number"
                            name="importeTotal"
                            value={formData.importeTotal}
                            onChange={handleChange}
                            className="w-full border-gray-300 rounded-none bg-transparent text-black text-xs border-x border-t h-10 px-4 transition-all"
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
                            <p className="text-gray-100 font-bold text-3xl">Enviar</p>
                        </button>
                    </form>
                )}

                {/* Errores y respuestas */}
                {error && (
                    <div className="mt-8 w-full ml-8 p-4 border-l-4 border-red-500">
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                )}
                {respuesta && (
                    <div className="mt-8 p-4 border-l-4 w-full ml-8 border-black">
                        <div className='w-full flex flex-row justify-between pr-4 pb-6 items-center'>
                            <h3 className="text-black text-xl font-bold">Resultados</h3>
                            <button
                                onClick={copyResultsToClipboard}
                                className="bg-gray-300 gap-2 text-black rounded-full flex items-center py-4 pl-3 pr-4 h-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                                    <path fillRule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 0 1-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0 1 13.5 1.5H15a3 3 0 0 1 2.663 1.618ZM12 4.5A1.5 1.5 0 0 1 13.5 3H15a1.5 1.5 0 0 1 1.5 1.5H12Z" clipRule="evenodd" />
                                    <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 0 1 9 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0 1 16.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625v-12Z" />
                                    <path d="M10.5 10.5a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279h-1.875a.375.375 0 0 1-.375-.375V10.5Z" />
                                </svg>
                                <p>
                                    Copiar
                                </p>
                            </button>
                        </div>
                        {Array.isArray(respuesta) ? (
                            respuesta.map((resp, index) => (
                                <div key={index} className="space-y-1 mb-4 text-gray-700 text-sm">
                                    <p className='text-center items-center flex justify-center w-4 h-4 bg-black rounded-full text-[10px] font-bold text-gray-100'>{index + 1}</p>
                                    <p>CAE: <span className="text-black">{resp.cae || 'No generado'}</span></p>
                                    <p>Vencimiento: <span className="text-black">{resp.caeFchVto || 'N/A'}</span></p>
                                    <p>Comprobante numero: <span className="text-black">{resp.cbteDesde}</span></p>
                                    {resp.errores && (
                                        <p className="text-red-main">Error: {Array.isArray(resp.errores) ? resp.errores.map(e => e.Msg).join(', ') : resp.errores.Msg}</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="space-y-1 text-gray-700 text-sm">
                                <p>CAE: <span className="text-black">{respuesta.cae}</span></p>
                                <p>Vencimiento: <span className="text-black">{respuesta.caeFchVto}</span></p>
                                <p>Número: <span className="text-black">{respuesta.cbteDesde}</span></p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </>
    );
};

export default FacturaForm;