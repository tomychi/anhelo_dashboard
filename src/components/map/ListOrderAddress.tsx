import { useSelector } from 'react-redux';
import { RootState } from '../../redux/configureStore';
import { useContext, useEffect, useState } from 'react';
import { PlacesContext } from '../../context';
import { Feature } from '../../interfaces/places';
import { SearchBar } from './SearchBar';
import { PedidoProps } from '../../types/types';

export const ListOrderAddress = () => {
  const { orders } = useSelector((state: RootState) => state.data);
  const { searchPlacesByTerm } = useContext(PlacesContext);
  const [, setSearchResults] = useState<Feature[]>([]);
  const [unmatchedOrders, setUnmatchedOrders] = useState<PedidoProps[]>([]);

  // Array de estados para controlar la visibilidad del SearchBar para cada componente
  const [showSearchBarArray, setShowSearchBarArray] = useState(
    unmatchedOrders.map(() => false)
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        let allResults: Feature[] = []; // Initialize an array to store all results
        const unmatchedOrdersArray: PedidoProps[] = []; // Declare as const
        for (const order of orders) {
          const results = await searchPlacesByTerm(order.direccion);
          if (results.length === 0) {
            unmatchedOrdersArray.push(order); // Store the entire order object
          } else {
            allResults = [...allResults, ...results]; // Concatenate the results
          }
        }
        setSearchResults(allResults); // Update the state with all results at once
        setUnmatchedOrders(unmatchedOrdersArray); // Update the state with unmatched orders
      } catch (error) {
        console.error('Error al obtener la ubicación del usuario:', error);
      }
    };
    fetchData();
  }, []);

  const toggleSearchBar = (index: number) => {
    const newShowSearchBarArray = unmatchedOrders.map((order, i) =>
      i === index ? !showSearchBarArray[i] : false
    );
    setShowSearchBarArray(newShowSearchBarArray);
  };

  return (
    <div
      style={{
        height: '90vh',
        left: 0,
        top: 0,
      }}
      className="left-4 w-60 bg-white rounded-lg shadow-md p-1 overflow-y-auto"
    >
      {unmatchedOrders.map((s, index) => {
        return (
          <div key={`${s.id}-${index}`}>
            <b>{s.direccion}</b>
            <div
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => toggleSearchBar(index)}
            >
              Ver!
            </div>
            {showSearchBarArray[index] && <SearchBar />}
          </div>
        );
      })}
    </div>
  );
};
