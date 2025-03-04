import { useState, useEffect } from 'react';
import SalesCards from './SalesCards';
import LoadingPoints from '../LoadingPoints';
import { ReadLastThreeDaysOrders, marcarPedidoComoFacturado, ReadDataForDateRange } from '../../firebase/ReadData'
import { useSelector } from 'react-redux';
import Calendar from '../Calendar'

// URL del backend en AWS EC2
const BASE_URL = 'https://backend.onlyanhelo.com';


const FacturaForm = () => {
    const [respuesta, setRespuesta] = useState(null);
    const [error, setError] = useState(null);
    const [tokenStatus, setTokenStatus] = useState(null);
    const [isLoadingToken, setIsLoadingToken] = useState(false);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const [showIndividualForm, setShowIndividualForm] = useState(false);
    const [formData, setFormData] = useState({
        cuit: '33718835289',
        puntoVenta: '2',
        tipoFactura: 'B',
        importeNeto: '',
        importeTrib: '',
        importeTotal: ''
    });
    const [ventasSinFacturar, setVentasSinFacturar] = useState([]);
    const [facturasEmitidas, setFacturasEmitidas] = useState([]);
    const [isLoadingFacturas, setIsLoadingFacturas] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { valueDate } = useSelector((state) => state.data);

    useEffect(() => {
        const fetchLastThreeDaysOrders = async () => {
            try {
                const orders = await ReadLastThreeDaysOrders();
                console.log("Pedidos de los últimos 3 días:", orders);
            } catch (error) {
                console.error("Error al obtener los pedidos de los últimos 3 días:", error);
            }
        };

        fetchLastThreeDaysOrders();
    }, []);


    const checkTokenStatus = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/afip/token/status`);
            const data = await response.json();
            if (data.success) {
                setTokenStatus(data.data);
            } else {
                setTokenStatus({ valid: false });
            }
        } catch (error) {
            console.error('Error al verificar token:', error);
            setTokenStatus({ valid: false });
        }
    };

    useEffect(() => {
        checkTokenStatus();
        const interval = setInterval(checkTokenStatus, 300000); // Verifica cada 5 minutos
        return () => clearInterval(interval);
    }, []);



    useEffect(() => {
        const fetchPedidosSinFacturar = async () => {
            try {
                const pedidosSinFacturar = await ReadLastThreeDaysOrders();
                console.log("Pedidos sin facturar de los últimos 3 días:", pedidosSinFacturar);
                console.log("Cantidad de pedidos sin facturar:", pedidosSinFacturar.length);

                // Transforma los pedidos al formato que necesita ventasSinFacturar
                const ventasFormateadas = pedidosSinFacturar.map(pedido => ({
                    id: pedido.id,
                    fecha: pedido.fecha,
                    hora: pedido.hora,
                    importeTotal: pedido.total.toString(),
                    importeNeto: (pedido.total / 1.21).toFixed(2),
                    importeTrib: "0.00",
                    quiereFacturarla: true // Por defecto marcamos que queremos facturarla
                }));

                // Actualiza el estado
                setVentasSinFacturar(ventasFormateadas);
            } catch (error) {
                console.error("Error al obtener los pedidos sin facturar:", error);
            }
        };

        fetchPedidosSinFacturar();
    }, []);

    useEffect(() => {
        const fetchPedidosFacturados = async () => {
            if (!valueDate) return;

            setIsLoadingFacturas(true);
            try {
                // Use ReadDataForDateRange to get all orders for the date range
                const allOrders = await ReadDataForDateRange('pedidos', valueDate);

                // Filter only those with datosFacturacion
                const orderosFacturados = allOrders.filter(
                    (pedido) => pedido.datosFacturacion
                );

                // Format the data for display
                const facturasFormateadas = orderosFacturados.map(pedido => ({
                    id: pedido.id,
                    fecha: pedido.fecha,
                    hora: pedido.hora,
                    cliente: pedido.nombreCliente || 'Cliente',
                    telefono: pedido.telefonoCliente || 'N/A',
                    total: pedido.total,
                    cae: pedido.datosFacturacion.cae,
                    numeroFactura: pedido.datosFacturacion.numeroComprobante || pedido.datosFacturacion.numeroFactura,
                    tipoFactura: pedido.datosFacturacion.tipoComprobante || pedido.datosFacturacion.tipoFactura,
                    fechaEmision: new Date(pedido.datosFacturacion.fechaEmision).toLocaleDateString(),
                }));

                setFacturasEmitidas(facturasFormateadas);
            } catch (error) {
                console.error("Error al obtener los pedidos facturados:", error);
                setError("Error al cargar facturas emitidas");
            } finally {
                setIsLoadingFacturas(false);
            }
        };

        fetchPedidosFacturados();
    }, [valueDate]);

    const handleGenerateToken = async () => {
        setIsLoadingToken(true);
        setError(null);

        // Verificar si el token sigue siendo válido antes de generarlo
        await checkTokenStatus();

        if (tokenStatus?.valid) {
            setIsLoadingToken(false);
            console.log("El token sigue siendo válido, no se necesita generar uno nuevo.");
            return;  // Salir sin hacer la petición
        }

        try {
            const response = await fetch(`${BASE_URL}/api/afip/token/generate`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setTokenStatus(data.data); // Actualizar el estado con el nuevo token
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
            const response = await fetch(`${BASE_URL}/api/afip/factura`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            // Console log de la respuesta completa
            console.log('Respuesta completa del backend (factura individual):', data);

            if (!response.ok) {
                throw new Error(`${data.message || 'Error al procesar la factura'}${data.errorDetails ? `: ${data.errorDetails}` : ''}`);
            }

            if (data.success && data.data.resultado === 'A') {
                setRespuesta({
                    cae: data.data.cae,
                    fechaVencimiento: data.data.caeFchVto,
                    cbteDesde: data.data.cbteDesde,
                    cbteHasta: data.data.cbteHasta
                });

                const facturaData = {
                    cae: data.data.cae,
                    fechaEmision: new Date().toISOString(),
                    fechaVencimiento: data.data.caeFchVto,
                    tipoFactura: formData.tipoFactura,
                    numeroFactura: data.data.cbteDesde,
                    cuit: formData.cuit,
                    importeTotal: formData.importeTotal
                };

                // Si este formulario individual se está usando para facturar un pedido específico
                // (debería haber alguna referencia al ID del pedido en formData o en algún estado)
                if (formData.pedidoId && formData.fechaPedido) {
                    await marcarPedidoComoFacturado(formData.pedidoId, formData.fechaPedido);
                }

            } else {
                const errorMsg = data.errorDetails ||
                    (Array.isArray(data.data?.errores) ? data.data.errores.map(err => err.Msg).join(', ') :
                        data.data?.errores?.Msg || data.data?.observaciones?.Msg || data.message || 'Error desconocido');
                setError(errorMsg);
            }
        } catch (error) {
            setError(error.message || 'Error de conexión con el servidor');
            console.error('Error en handleSubmitSingle:', error);
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
                setIsLoadingSubmit(false);
                return;
            }

            // Array para almacenar todas las respuestas
            const todasLasRespuestas = [];

            // Procesar las facturas una por una
            for (let i = 0; i < ventasAFacturar.length; i++) {
                const venta = ventasAFacturar[i];

                // Datos de facturación para el pedido actual
                const facturaData = {
                    cuit: formData.cuit,
                    puntoVenta: formData.puntoVenta,
                    tipoFactura: formData.tipoFactura,
                    importeNeto: venta.importeNeto,
                    importeTrib: venta.importeTrib,
                    importeTotal: venta.importeTotal
                };

                console.log(`Procesando factura ${i + 1}/${ventasAFacturar.length} para pedido ID: ${venta.id}`);

                try {
                    // Enviar solicitud para una sola factura
                    const response = await fetch(`${BASE_URL}/api/afip/factura`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(facturaData)
                    });

                    const data = await response.json();
                    console.log(`Respuesta de factura ${i + 1}:`, data);

                    // Preparar la respuesta para mostrar al usuario
                    let respuestaFactura;

                    if (response.ok && data.success && data.data.resultado === 'A') {
                        // Factura generada con éxito
                        respuestaFactura = {
                            cae: data.data.cae,
                            caeFchVto: data.data.caeFchVto,
                            cbteDesde: data.data.cbteDesde,
                            cbteHasta: data.data.cbteHasta
                        };

                        // Crear objeto con datos de facturación para almacenar en Firebase
                        const datosFacturacion = {
                            cuit: formData.cuit,
                            cae: data.data.cae,
                            fechaEmision: new Date().toISOString(),
                            tipoComprobante: formData.tipoFactura,
                            puntoVenta: formData.puntoVenta,
                            numeroComprobante: data.data.cbteDesde,
                            documentoReceptor: 99,  // Siempre 99
                            numeroReceptor: 0      // Siempre 0
                        };

                        // Actualizar el estado en Firebase
                        await marcarPedidoComoFacturado(venta.id, venta.fecha, datosFacturacion);

                        console.log(`Factura ${i + 1} procesada con éxito. CAE: ${data.data.cae}`);
                    } else {
                        // Error al generar la factura
                        const errorMsg = data.errorDetails ||
                            (Array.isArray(data.data?.errores) ? data.data.errores.map(err => err.Msg).join(', ') :
                                data.data?.errores?.Msg || data.data?.observaciones?.Msg || data.message || 'Error desconocido');

                        respuestaFactura = {
                            error: errorMsg,
                            cae: 'No generado'
                        };

                        console.log(`Error al procesar factura ${i + 1}: ${errorMsg}`);
                    }

                    // Agregar esta respuesta al array de todas las respuestas
                    todasLasRespuestas.push(respuestaFactura);

                } catch (error) {
                    // Error de red o en la solicitud
                    console.error(`Error al procesar factura ${i + 1}:`, error);
                    todasLasRespuestas.push({
                        error: error.message || 'Error de conexión con el servidor',
                        cae: 'No generado'
                    });
                }
            }

            // Mostrar todas las respuestas al usuario
            setRespuesta(todasLasRespuestas);

            // Determinar si hubo algún error
            const facturasFallidas = todasLasRespuestas.filter(f => f.error || (!f.cae || f.cae === 'No generado'));
            if (facturasFallidas.length > 0 && facturasFallidas.length === todasLasRespuestas.length) {
                setError('No se generó ninguna factura correctamente');
            } else if (facturasFallidas.length > 0) {
                setError('Algunas facturas no se generaron correctamente');
            }

            // Refrescar la lista de ventas sin facturar
            if (facturasFallidas.length < todasLasRespuestas.length) {
                // Hay al menos una factura exitosa, refrescar la lista
                try {
                    const pedidosActualizados = await ReadLastThreeDaysOrders();
                    const ventasFormateadas = pedidosActualizados.map(pedido => ({
                        id: pedido.id,
                        fecha: pedido.fecha,
                        hora: pedido.hora,
                        importeTotal: pedido.total.toString(),
                        importeNeto: (pedido.total / 1.21).toFixed(2),
                        importeTrib: "0.00",
                        quiereFacturarla: true
                    }));
                    setVentasSinFacturar(ventasFormateadas);
                } catch (error) {
                    console.error("Error al actualizar la lista de ventas sin facturar:", error);
                }
            }

        } catch (error) {
            setError(error.message || 'Error general en el proceso de facturación');
            console.error('Error en handleSubmitMultiple:', error);
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
            textToCopy = respuesta.map((resp, index) => {
                return `FACTURA ${index + 1}:\n` +
                    (resp.cae ?
                        `CAE: ${resp.cae}\nVencimiento: ${resp.caeFchVto || 'N/A'}\nComprobante número: ${resp.cbteDesde}\n` :
                        `Error: ${resp.error || 'No generado'}\n`) +
                    '------------------------\n';
            }).join('\n');
        } else {
            textToCopy = `CAE: ${respuesta.cae}\n` +
                `Vencimiento: ${respuesta.fechaVencimiento || respuesta.caeFchVto}\n` +
                `Número: ${respuesta.cbteDesde}`;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => alert('Resultados copiados al portapapeles'))
            .catch(err => {
                console.error('Error al copiar: ', err);
                alert('No se pudo copiar al portapapeles. Error: ' + err);
            });
    };

    const filteredFacturas = facturasEmitidas.filter(factura =>
        factura.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.cae.includes(searchTerm) ||
        factura.numeroFactura.toString().includes(searchTerm)
    );

    const copyFacturaToClipboard = (factura) => {
        const textToCopy = `FACTURA ${factura.tipoFactura} N° ${factura.numeroFactura}\n` +
            `Fecha: ${factura.fechaEmision}\n` +
            `CAE: ${factura.cae}\n` +
            `Cliente: ${factura.cliente}\n` +
            `Teléfono: ${factura.telefono}\n` +
            `Total: $${factura.total.toLocaleString()}`;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Mostrar una notificación temporal
                const notification = document.createElement('div');
                notification.style.position = 'fixed';
                notification.style.bottom = '20px';
                notification.style.padding = '0 20px';
                notification.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                notification.style.color = 'white';
                notification.style.borderRadius = '9999px';
                notification.style.left = '0';
                notification.style.right = '0';
                notification.style.marginLeft = '1rem';
                notification.style.marginRight = '1rem';
                notification.style.width = 'calc(100% - 2rem)';
                notification.style.height = '40px';
                notification.style.zIndex = '1000';
                notification.style.textAlign = 'center';
                notification.style.fontFamily = 'Coolvetica, sans-serif';
                notification.style.fontWeight = 'bold';
                notification.style.backdropFilter = 'blur(8px)';
                notification.style.WebkitBackdropFilter = 'blur(8px)';
                notification.style.display = 'flex';
                notification.style.alignItems = 'center';
                notification.style.justifyContent = 'center';
                notification.style.gap = '8px';

                // Crear el SVG
                const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgIcon.setAttribute('viewBox', '0 0 24 24');
                svgIcon.setAttribute('fill', 'currentColor');
                svgIcon.style.width = '24px';  // h-6 equivale a 24px
                svgIcon.style.height = '24px'; // h-6 equivale a 24px
                svgIcon.style.flexShrink = '0';

                // Crear el path dentro del SVG
                const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                svgPath.setAttribute('fill-rule', 'evenodd');
                svgPath.setAttribute('clip-rule', 'evenodd');
                svgPath.setAttribute('d', 'M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z');

                // Añadir el path al SVG
                svgIcon.appendChild(svgPath);

                // Crear un span para el texto
                const textSpan = document.createElement('span');
                textSpan.textContent = 'Factura copiada al portapapeles';

                // Añadir el SVG y el texto a la notificación
                notification.appendChild(svgIcon);
                notification.appendChild(textSpan);

                document.body.appendChild(notification);

                // Desaparecer la notificación después de 2 segundos
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 500);
                }, 2000);
            })
            .catch(err => {
                console.error('Error al copiar factura: ', err);
                alert('No se pudo copiar la factura al portapapeles. Error: ' + err);
            });
    };

    return (
        <>
            <style>{`select:invalid { color: #9CA3AF; }`}</style>
            <div className="font-coolvetica flex flex-col items-center justify-center w-full">
                <div className="py-8 flex flex-row justify-between px-4 w-full items-baseline">
                    <div className='flex flex-col'>
                        <h2 className='text-3xl font-bold'>Facturación</h2>
                        <div className="flex flex-row items-center gap-1">

                            <h2 className="text-xs font-bold text-gray-400">
                                {tokenStatus?.valid ? (
                                    <div className='flex flex-row items-center gap-1'>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <h2 className="text-xs font-bold text-gray-400">
                                            Conectado hasta las {new Date(tokenStatus.expirationTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs
                                        </h2>

                                    </div>
                                ) : (
                                    <div className='flex flex-row items-center gap-1'>
                                        <span className="relative flex h-2 w-2">
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                                        </span>
                                        <button
                                            onClick={handleGenerateToken}
                                            disabled={isLoadingToken}
                                            className="font-bold text-xs text-gray-400"
                                        >
                                            {isLoadingToken ? 'Conectando...' : 'Conectar'} --
                                        </button>
                                    </div >
                                )}
                            </h2>
                        </div>
                        {ventasSinFacturar.length === 0 ? (
                            <div className='flex flex-row gap-1 -ml-[1.2px] items-center'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-2.5 text-green-500">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
                                </svg>
                                <p className="font-bold text-gray-400 text-xs">
                                    Estás al día con tus facturas
                                </p>
                            </div>
                        ) : null}
                    </div>
                    <button
                        onClick={toggleIndividualForm}
                        className="bg-gray-300 gap-2 text-black font-bold rounded-full flex items-center py-4 pl-3 pr-4 h-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
                            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                        </svg>
                        <p>{showIndividualForm ? 'Ocultar' : 'Individual'}</p>
                    </button>
                </div>

                {/* Calendar component for date selection */}
                <div className="w-full px-4 mb-4">
                    <h3 className="text- font-bold mb-2">Historial</h3>
                    <Calendar />
                    <div className="flex items-center w-full h-10 gap-1 mt-2 rounded-lg border-4 border-black focus:ring-0 font-coolvetica text-black text-xs font-light">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-6 ml-1.5 mb-0.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por cliente, CAE o número de factura"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Display list of facturas */}
                <div className="w-full  mb-8">
                    {isLoadingFacturas ? (
                        <div className="flex justify-center items-center py-8">
                            <LoadingPoints color="text-black" />
                        </div>
                    ) : filteredFacturas.length > 0 ? (
                        <div className="w-full">
                            <table className="w-full text-xs text-left text-black">
                                <thead className="text-black border-b  h-10">
                                    <tr>
                                        <th scope="col" className="pl-4">CAE</th>
                                        <th scope="col" className="pl-4">Fecha</th>
                                        <th scope="col" className="pl-4">Tipo</th>
                                        <th scope="col" className="pl-4">PDV</th>
                                        <th scope="col" className="pl-4">Nro</th>
                                        <th scope="col" className="pl-4">Total</th>
                                        <th scope="col" className="pl-4">Cliente</th>
                                        <th scope="col" className="pl-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFacturas.map((factura) => (
                                        <tr
                                            key={factura.id}
                                            className="text-black border font-light h-10 border-black border-opacity-20"
                                        >
                                            <td className="pl-4 font-light">{factura.cae ? `${factura.cae.substring(0, 4)}...` : ''}</td>
                                            <td className="pl-4 font-light">{factura.fechaEmision}</td>
                                            <td className="pl-4 font-light">{factura.tipoFactura}</td>
                                            <td className="pl-4 font-light">2</td>

                                            <td className="pl-4 font-light"> {factura.numeroFactura}</td>
                                            <td className="pl-4 font-light">${factura.total.toLocaleString()}</td>
                                            <td className="pl-4 font-light">99 0</td>
                                            <td className="pl-4 font-light pr-4">
                                                <button
                                                    onClick={() => copyFacturaToClipboard(factura)}
                                                    className="cursor-pointer hover:opacity-75 transition-opacity"
                                                    title="Copiar datos de factura"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                                                        <path fillRule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 0 1-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0 1 13.5 1.5H15a3 3 0 0 1 2.663 1.618ZM12 4.5A1.5 1.5 0 0 1 13.5 3H15a1.5 1.5 0 0 1 1.5 1.5H12Z" clipRule="evenodd" />
                                                        <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 0 1 9 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0 1 16.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625v-12Z" />
                                                        <path d="M10.5 10.5a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279h-1.875a.375.375 0 0 1-.375-.375V10.5Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : valueDate ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay facturas emitidas en el período seleccionado
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Selecciona un rango de fechas para ver las facturas emitidas
                        </div>
                    )}
                </div>

                {showIndividualForm && (
                    <form onSubmit={handleSubmitSingle} className="px-4 w-full">
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

                <div className='w-full'>
                    {ventasSinFacturar.length > 0 ? (
                        <div className='flex flex-col mb-8'>
                            <SalesCards ventas={ventasSinFacturar} onToggleFacturar={handleToggleFacturar} />
                            <div className='px-4'>
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
                        </div>
                    ) : null}
                </div>

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
                                <p className='font-bold'>Copiar</p>
                            </button>
                        </div>
                        {Array.isArray(respuesta) ? (
                            respuesta.map((resp, index) => (
                                <div key={index} className="space-y-1 mb-4 text-gray-700 text-sm">
                                    <p className='text-center items-center flex justify-center w-4 h-4 bg-black rounded-full text-[10px] font-bold text-gray-100'>{index + 1}</p>
                                    {resp.cae ? (
                                        <>
                                            <p>CAE: <span className="text-black">{resp.cae}</span></p>
                                            <p>Vencimiento: <span className="text-black">{resp.caeFchVto || 'N/A'}</span></p>
                                            <p>Comprobante número: <span className="text-black">{resp.cbteDesde}</span></p>
                                        </>
                                    ) : (
                                        <p className="text-red-500">
                                            Error: {resp.error || resp.errores?.Msg || (Array.isArray(resp.errores) ? resp.errores.map(e => e.Msg).join(', ') : 'No generado')}
                                            {resp.details && <span> - {resp.details}</span>}
                                        </p>
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