import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateOrderCookNow } from '../../firebase/UploadOrder';
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
};

type PhoneSearchProps = {
    orders: Order[];
};

const PhoneSearch: React.FC<PhoneSearchProps> = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Order[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loadingCook, setLoadingCook] = useState<Record<string, boolean>>({});
    const searchRef = useRef<HTMLDivElement>(null);

    // Debounce search input
    const debouncedSearchTerm = useMemo(
        () => _.debounce((term: string) => setSearchTerm(term), 300),
        []
    );

    const cleanAddressForSearch = (fullAddress: string): string => {
        if (!fullAddress) return '';

        // 1. Convertir a minúsculas y normalizar
        let address = fullAddress.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        // 2. Remover códigos postales (X seguido de números)
        address = address.replace(/x\d+/g, '');

        // 3. Remover partes comunes de la dirección
        const partsToRemove = [
            'rio cuarto',
            'cordoba',
            'argentina',
            ', x'  // Para casos donde quedó una coma seguida de x
        ];

        partsToRemove.forEach(part => {
            address = address.replace(new RegExp(part, 'gi'), '');
        });

        // 4. Limpiar comas y espacios múltiples
        address = address.replace(/\s+/g, ' ')
            .replace(/,+/g, ',')
            .replace(/\s*,\s*/g, ',')
            .trim();

        return address;
    };

    const filteredOrders = useMemo(() => {
        if (!orders || !searchTerm.trim()) {
            return [];
        }

        const isNumericSearch = /\d/.test(searchTerm);

        return orders.filter(order => {
            if (isNumericSearch) {
                // Para búsqueda numérica, solo buscar en teléfono
                const cleanPhone = (order.telefono || '').replace(/\D/g, '');
                const cleanSearch = searchTerm.replace(/\D/g, '');
                return cleanPhone.includes(cleanSearch);
            } else {
                // Para búsqueda de texto, buscar en la dirección limpia
                const cleanedAddress = cleanAddressForSearch(order.direccion);
                const normalizedSearch = searchTerm.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .trim();

                // Dividir la búsqueda en palabras para buscar cada una
                const searchWords = normalizedSearch.split(/\s+/);

                // Retornar true solo si todas las palabras de búsqueda están en la dirección
                return searchWords.every(word => cleanedAddress.includes(word));
            }
        });
    }, [searchTerm, orders]);

    // Update search results
    useEffect(() => {
        setSearchResults(filteredOrders);
        setShowResults(filteredOrders.length > 0);
    }, [filteredOrders]);

    // Click outside handler
    useEffect(() => {
        if (!showResults) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        const handleScroll = _.throttle(() => {
            if (showResults) {
                setShowResults(false);
            }
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

    const getCookButtonText = (pedido: Order): string => {
        if (pedido.elaborado) {
            return "Ya cocinado";
        }
        return pedido.cookNow ? "No priorizar" : "Cocinar YA";
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price);
    };

    const formatAddress = (direccion: string) => {
        if (!direccion) return 'Sin dirección';
        const mainPart = direccion.split(',')[0];
        return mainPart.toLowerCase().charAt(0).toUpperCase() + mainPart.toLowerCase().slice(1);
    };

    // Highlight matching text with improved normalization
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
            // Para texto, solo buscar en la parte principal
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

    return (
        <div className="relative w-full mt-4" ref={searchRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por teléfono o dirección..."
                    onChange={(e) => debouncedSearchTerm(e.target.value)}
                    className="w-full h-10 px-4 rounded-full bg-gray-100 border-black border-4 focus:outline-none text-xs"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                </svg>
            </div>

            {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto bg-white shadow-lg rounded-lg border border-gray-200">
                    {searchResults.map((order) => (
                        <div key={order.id} className="p-4 border-b hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">
                                        {highlightMatch(order.telefono, searchTerm)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {highlightMatch(order.direccion, searchTerm)}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        {order.elaborado ? (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Elaborado</span>
                                        ) : (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                                        )}
                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                            {order.cadete === "NO ASIGNADO" ? "Sin cadete" : order.cadete}
                                        </span>
                                        {order.cookNow && !order.elaborado && (
                                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Priorizado</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatPrice(order.total)}</p>
                                    <p className="text-sm text-gray-600">{order.hora}</p>

                                </div>
                            </div>
                            {!order.elaborado && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendToCook(order);
                                    }}
                                    disabled={loadingCook[order.id]}
                                    className={`mt-2 w-full h-10 px-4 py-1 rounded-md  text-xs font-bold ${order.cookNow
                                        ? 'bg-gray-300 text-red-main '
                                        : 'bg-black text-gray-100'
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
                            <div className="mt-2">
                                {order.detallePedido.map((item, index) => (
                                    <p key={index} className="text-sm text-gray-600">
                                        {item.quantity}x {item.burger}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhoneSearch;