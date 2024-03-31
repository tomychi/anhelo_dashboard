import { useSelector } from 'react-redux';
import { RootState } from '../../redux/configureStore';
import { useContext, useState } from 'react';
import { PlacesContext } from '../../context';
import { SearchResults } from './SearchResults';
import { Feature } from '../../interfaces/places';
import { SearchBar } from './SearchBar';

export const ListOrderAddress = () => {
  const { orders } = useSelector((state: RootState) => state.data);
  const { searchPlacesByTerm } = useContext(PlacesContext);
  const [searchResults, setSearchResults] = useState<Feature[]>([]);

  const [selectedAddress, setSelectedAddress] = useState('');

  const handleSearch = async (direccion: string) => {
    setSelectedAddress(direccion);
    const results = await searchPlacesByTerm(direccion);
    setSearchResults(results);
  };

  return (
    <div className="relative">
      <div
        className="absolute top-4 left-4 w-60 bg-white rounded-lg shadow-md p-1 overflow-y-auto"
        style={{ zIndex: 999 }}
      >
        <h2 className="text-lg font-semibold mb-2">Dirección de Pedido</h2>
        {orders.map((order) => (
          <div key={order.id} className="mb-4">
            <div className="relative">
              <div
                className="bg-white rounded-lg shadow-md p-1 overflow-y-auto"
                style={{ zIndex: 999 }}
              >
                <div className="bg-blue-500 text-white border border-gray-200 py-2 px-4 mb-2 flex justify-between items-center rounded">
                  <h3>{order.direccion}</h3>
                  <button
                    onClick={() => handleSearch(order.direccion)}
                    className="text-sm py-1 px-2 border rounded border-white text-white bg-transparent border-blue-500 text-blue-500 hover:bg-blue-100"
                  >
                    Ver!
                  </button>
                </div>
                {selectedAddress === order.direccion && (
                  <div className="mt-2">
                    <h3 className="text-lg font-semibold mb-2">
                      Resultados de Búsqueda
                    </h3>
                    {/* Renderiza los resultados de búsqueda aquí */}

                    {searchResults.length === 0 ? (
                      <SearchBar />
                    ) : (
                      <SearchResults />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
