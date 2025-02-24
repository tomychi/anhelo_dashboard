import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateOrderPaymentMethod } from '../../firebase/UploadOrder';
import { updateOrderCookNow } from '../../firebase/UploadOrder';
import currencyFormat from "../../helpers/currencyFormat";
import { CardComanda } from "../comandera/Card/CardComanda";
import _ from 'lodash';

type Order = {
    id: string;
    telefono: string;
    direccion: string;
    total: number;
    hora: string;
    elaborado: boolean;
    cookNow: boolean;
    cadete: string;
    detallePedido: Array<{
        quantity: number;
        burger: string;
    }>;
    fecha: string;
    metodoPago: string;
    seFacturo?: boolean; // Añadimos seFacturo como opcional
};

type PhoneSearchProps = {
    orders: Order[];
};

const PhoneSearch: React.FC<PhoneSearchProps> = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Order[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loadingCook, setLoadingCook] = useState<Record<string, boolean>>({});
    const [loadingPaid, setLoadingPaid] = useState<Record<string, boolean>>({});
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const debouncedSearchTerm = useMemo(
        () => _.debounce((term: string) => setSearchTerm(term), 300),
        []
    );

    const cleanAddressForSearch = (fullAddress: string): string => {
        if (!fullAddress) return '';
        let address = fullAddress.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/x\d+/g, '')
            .replace(/rio cuarto|cordoba|argentina|, x/gi, '')
            .replace(/\s+/g, ' ')
            .replace(/,+/g, ',')
            .replace(/\s*,\s*/g, ',')
            .trim();
        return address;
    };

    const filteredOrders = useMemo(() => {
        if (!orders || !searchTerm.trim()) return [];
        const isNumericSearch = /\d/.test(searchTerm);
        return orders.filter(order => {
            if (isNumericSearch) {
                const cleanPhone = (order.telefono || '').replace(/\D/g, '');
                const cleanSearch = searchTerm.replace(/\D/g, '');
                return cleanPhone.includes(cleanSearch);
            } else {
                const cleanedAddress = cleanAddressForSearch(order.direccion);
                const normalizedSearch = searchTerm.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .trim();
                const searchWords = normalizedSearch.split(/\s+/);
                return searchWords.every(word => cleanedAddress.includes(word));
            }
        });
    }, [searchTerm, orders]);

    useEffect(() => {
        setSearchResults(filteredOrders);
        setShowResults(filteredOrders.length > 0);
    }, [filteredOrders]);

    useEffect(() => {
        if (!showResults) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        const handleScroll = _.throttle(() => {
            if (showResults) setShowResults(false);
        }, 100);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
            handleScroll.cancel();
        };
    }, [showResults]);

    const handleSendToCook = async (pedido: Order) => {
        setLoadingCook((prev) => ({ ...prev, [pedido.id]: true }));
        try {
            const nuevoEstadoCookNow = !pedido.cookNow;
            await updateOrderCookNow(pedido.fecha, pedido.id, nuevoEstadoCookNow);
        } catch (error) {
            console.error('Error al modificar estado de cocina:', error);
        } finally {
            setLoadingCook((prev) => ({ ...prev, [pedido.id]: false }));
        }
    };

    const handleMarkAsPaid = async (pedido: Order) => {
        setLoadingPaid((prev) => ({ ...prev, [pedido.id]: true }));
        try {
            const nuevoMetodoPago = pedido.metodoPago === 'mercadoPago' ? 'efectivo' : 'mercadoPago';
            await updateOrderPaymentMethod(pedido.fecha, pedido.id, nuevoMetodoPago);
            setSearchResults((prev) =>
                prev.map((order) =>
                    order.id === pedido.id
                        ? {
                            ...order,
                            metodoPago: nuevoMetodoPago,
                            ...(nuevoMetodoPago === 'efectivo' ? { seFacturo: undefined } : { seFacturo: false })
                        }
                        : order
                )
            );
        } catch (error) {
            console.error('Error al modificar el método de pago:', error);
            throw error;
        } finally {
            setLoadingPaid((prev) => ({ ...prev, [pedido.id]: false }));
        }
    };

    const getCookButtonText = (pedido: Order): string => {
        if (pedido.elaborado) return "Ya cocinado";
        return pedido.cookNow ? "No priorizar" : "Cocinar ya";
    };

    const highlightMatch = (text: string, searchTerm: string) => {
        if (!searchTerm.trim() || !text) return text;
        const isNumericSearch = /\d/.test(searchTerm);
        if (isNumericSearch) {
            const cleanText = text.replace(/\D/g, '');
            const cleanSearch = searchTerm.replace(/\D/g, '');
            const index = cleanText.indexOf(cleanSearch);
            if (index === -1) return text;
            return (
                <>
                    {text.slice(0, index)}
                    <span className="bg-yellow-200">
                        {text.slice(index, index + cleanSearch.length)}
                    </span>
                    {text.slice(index + cleanSearch.length)}
                </>
            );
        } else {
            const mainText = text.split(',')[0];
            const normalizedText = mainText.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            const normalizedSearchTerm = searchTerm.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            const index = normalizedText.indexOf(normalizedSearchTerm);
            if (index === -1) return text;
            return (
                <>
                    {mainText.slice(0, index)}
                    <span className="bg-yellow-200">
                        {mainText.slice(index, index + searchTerm.length)}
                    </span>
                    {mainText.slice(index + searchTerm.length)}
                    {text.includes(',') ? text.slice(text.indexOf(',')) : ''}
                </>
            );
        }
    };

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setModalIsOpen(true);
    };

    return (
        <div className="relative w-full mt-4" ref={searchRef}>
            <div className="flex items-center h-10 gap-1 rounded-lg border-4 border-black focus:ring-0 text-black text-xs font-light">
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
                    placeholder="Buscar por teléfono o dirección..."
                    onChange={(e) => debouncedSearchTerm(e.target.value)}
                    className="w-full bg-transparent outline-none"
                />
            </div>

            {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto bg-white shadow-lg rounded-lg border border-gray-200">
                    {searchResults.map((order) => (
                        <div key={order.id} className="px-4 pb-4 pt-2 border-b hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className='w-full'>
                                    <p className="font-bold text-xl">
                                        {highlightMatch(order.telefono, searchTerm)}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {highlightMatch(order.direccion, searchTerm)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl">{currencyFormat(order.total)}</p>
                                    <p className="text-xs text-gray-600">{order.hora}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                                {order.elaborado ? (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Elaborado</span>
                                ) : (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">No elaborado</span>
                                )}
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    {order.cadete === "NO ASIGNADO" ? "Sin cadete" : order.cadete}
                                </span>
                                <button
                                    onClick={() => handleViewOrder(order)}
                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                >
                                    Ver
                                </button>
                                <button
                                    onClick={() => handleMarkAsPaid(order)}
                                    disabled={loadingPaid[order.id]} // Quitamos la condición de deshabilitar por 'mercadoPago'
                                    className={`text-xs px-2 py-1 rounded transition-colors ${order.metodoPago === 'mercadoPago'
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200' // Permitimos hover
                                        : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                        }`}
                                >
                                    {loadingPaid[order.id] ? (
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="w-1 h-1 bg-purple-800 rounded-full animate-pulse"></div>
                                            <div className="w-1 h-1 bg-purple-800 rounded-full animate-pulse delay-75"></div>
                                            <div className="w-1 h-1 bg-purple-800 rounded-full animate-pulse delay-150"></div>
                                        </div>
                                    ) : order.metodoPago === 'mercadoPago' ? 'Pagado' : 'Efectivo'}
                                </button>
                            </div>
                            {!order.elaborado && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendToCook(order);
                                    }}
                                    disabled={loadingCook[order.id]}
                                    className={`mt-4 bg-black w-full h-[64px] text-gray-100 rounded-lg flex justify-center font-bold items-center text-3xl font-coolvetica ${order.cookNow ? 'bg-gray-300 text-red-main' : 'bg-black text-gray-100'
                                        } transition-colors whitespace-nowrap`}
                                >
                                    {loadingCook[order.id] ? (
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                            <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-75"></div>
                                            <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-150"></div>
                                        </div>
                                    ) : (
                                        getCookButtonText(order)
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {modalIsOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center overflow-y-auto">
                    <div className="relative bg-white w-full h-full flex flex-col">
                        <div className="overflow-y-auto p-6 flex-grow">
                            <CardComanda {...selectedOrder} />
                        </div>
                        <div className="sticky bottom-0 bg-white p-4 border-t">
                            <button
                                onClick={() => setModalIsOpen(false)}
                                className="w-full bg-black text-white px-4 py-2 rounded"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneSearch;