import { useContext, useEffect, useState } from 'react';
import { MapContext, PlacesContext } from '../../context';
import { Feature } from '../../interfaces/places';
import { PedidoProps } from '../../types/types';
import { mapClickFn } from '../../apis/locationPickerApi';
import mapboxgl from 'mapbox-gl';
import { handleAddressSave } from '../../firebase/UploadOrder';
import { RootState } from '../../redux/configureStore';
import { useSelector } from 'react-redux';

interface SelectedAddress {
  address: string;
  id: string;
  fecha: string;
}

interface ListOrderAddressProps {
  orders: PedidoProps[];
}

export const ListOrderAddress = ({ orders }: ListOrderAddressProps) => {
  const user = useSelector((state: RootState) => state.auth.user);

  const userAdmin = 'tomas.arcostanzo5@gmail.com';
  const { searchPlacesByTerm } = useContext(PlacesContext);
  const [, setSearchResults] = useState<Feature[]>([]);
  const [unmatchedOrders, setUnmatchedOrders] = useState<PedidoProps[]>([]);
  const { map } = useContext(MapContext);
  const [selectedAddress, setSelectedAddress] = useState<{
    [key: string]: SelectedAddress;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        let allResults: Feature[] = []; // Initialize an array to store all results
        const unmatchedOrdersArray: PedidoProps[] = []; // Declare as const
        for (const order of orders) {
          const results = await searchPlacesByTerm(order.direccion, order);
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
    console.log('orders', orders);
  }, [orders]);

  const changeAddress = async () => {
    try {
      const updatePromises: Promise<void>[] = [];

      // Iterar sobre cada elemento de selectedAddress
      for (const id in selectedAddress) {
        const { fecha, address } = selectedAddress[id];
        console.log(fecha, address);
        if (address.trim() !== '') {
          // Verificar si la dirección no está vacía
          updatePromises.push(handleAddressSave(fecha, id, address));
        }
      }

      await Promise.all(updatePromises);
      console.log('Direcciones de pedidos actualizadas correctamente.');
    } catch (error) {
      console.error('Error al actualizar direcciones de pedidos:', error);
    }
  };

  const handleClick = async (id: string, fecha: string) => {
    let marker: mapboxgl.Marker;
    const clickHandler = async (e: mapboxgl.MapMouseEvent) => {
      try {
        const newAddress = await mapClickFn(e.lngLat);
        setSelectedAddress((prevState) => {
          return {
            ...prevState,
            [id]: { ...prevState[id], address: newAddress, fecha },
          };
        });
        if (marker == null) {
          marker = new mapboxgl.Marker({
            color: '#00ff00',
          })
            .setLngLat(e.lngLat)
            .addTo(map!);
        } else {
          marker.setLngLat(e.lngLat);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    map?.once('click', clickHandler); // Suscribirse al evento de clic una vez
  };

  const handleChange = (newValue: string, id: string) => {
    setSelectedAddress((prevState) => {
      return { ...prevState, [id]: { ...prevState[id], address: newValue } };
    });
  };

  return (
    <div>
      {user.email === userAdmin ? (
        <div
          className="w-full md:w-auto" // Ajusta para dispositivos móviles
          style={{
            height: '30vh', // Limita la altura a 30vh
            overflowY: 'auto', // Permite el desplazamiento vertical
          }}
        >
          {unmatchedOrders.length === 0 ? null : (
            <div
              style={{
                height: '90vh',
                left: 0,
                top: 0,
              }}
              className="left-4 w-60 bg-white rounded-lg shadow-md p-1 overflow-y-auto"
            >
              {Object.keys(selectedAddress).length > 0 && (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => changeAddress()}
                >
                  Cambiar
                </button>
              )}
              {unmatchedOrders.map((s, index) => {
                const isSelected = selectedAddress[s.id] !== undefined; // Verifica si la dirección está en selectedAddress
                return (
                  <div key={`${s.id}-${index}`} className="">
                    <div>{s.direccion}</div>
                    <div
                      onClick={() => handleClick(s.id, s.fecha)} // Pasa el índice como argumento aquí
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Marcar!
                    </div>
                    {/* Muestra el input solo si la dirección está en selectedAddress */}
                    {isSelected && (
                      <input
                        value={selectedAddress[s.id].address || ''}
                        type="text"
                        id={s.id}
                        onChange={(e) => handleChange(e.target.value, s.id)}
                      />
                    )}
                    {/* Usa el índice para acceder a la dirección correspondiente */}
                    {/* {showSearchBarArray[index] && <SearchBar />} */}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
