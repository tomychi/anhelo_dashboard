import { useSelector } from 'react-redux';
import { RootState } from '../../redux/configureStore';
import { useContext, useEffect, useState } from 'react';
import { PlacesContext } from '../../context';
import { SearchResults } from './SearchResults';
import { Feature } from '../../interfaces/places';
import { SearchBar } from './SearchBar';
import { PedidoProps } from '../../types/types';

export const ListOrderAddress = () => {
  const { orders } = useSelector((state: RootState) => state.data);
  const { searchPlacesByTerm } = useContext(PlacesContext);
  const [searchResults, setSearchResults] = useState<Feature[]>([]);
  const [unmatchedOrders, setUnmatchedOrders] = useState<PedidoProps[]>([]);

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

  return (
    <div
      style={{
        height: '90vh',
        left: 0,
        top: 0,
      }}
      className="left-4 w-60 bg-white rounded-lg shadow-md p-1 overflow-y-auto"
    >
      {/* {unmatchedOrders.length > 0 &&
        unmatchedOrders.map((s, index) => {
          return <div key={`${s.id}-${index}`}>{s.direccion}</div>;
        })} */}
    </div>
  );
};
