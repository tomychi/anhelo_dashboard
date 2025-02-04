import React, { useState, useEffect, useRef } from 'react';

type PhoneSearchProps = {
    orders: any[];
};

const PhoneSearch: React.FC<PhoneSearchProps> = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Filter orders based on search term
        if (searchTerm.length >= 3) {
            if (!orders) return;

            const filteredOrders = orders.filter(order => {
                return order.telefono && order.telefono.includes(searchTerm);
            });

            setSearchResults(filteredOrders);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [searchTerm, orders]);

    useEffect(() => {
        // Handle click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        // Handle scroll
        const handleScroll = () => {
            if (showResults) {
                setShowResults(false);
            }
        };

        // Add event listeners
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showResults]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price);
    };

    const formatAddress = (direccion) => {
        if (!direccion) return 'Sin dirección';
        const parts = direccion.split(',');
        return parts[0].toLowerCase().charAt(0).toUpperCase() + parts[0].toLowerCase().slice(1);
    };

    return (
        <div className="relative w-full mt-4" ref={searchRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 px-4 rounded-full bg-gray-100 border-black border-4  focus:outline-none text-xs"
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
                                    <p className="font-bold">{order.telefono}</p>
                                    <p className="text-sm text-gray-600">{formatAddress(order.direccion)}</p>
                                    <div className="flex gap-2 mt-1">
                                        {order.elaborado ? (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Elaborado</span>
                                        ) : (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                                        )}
                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                            {order.cadete === "NO ASIGNADO" ? "Sin cadete" : order.cadete}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatPrice(order.total)}</p>
                                    <p className="text-sm text-gray-600">{order.hora}</p>
                                </div>
                            </div>
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