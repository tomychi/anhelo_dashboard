import { useContext, useState } from 'react';
import { LoadingPlaces } from './';
import { MapContext, PlacesContext } from '../../context';
import { Feature } from '../../interfaces/places';
import { Marker, Popup } from 'mapbox-gl';

export const SearchResults = () => {
  const { placesOrder, isLoadingPlacesOrder, userLocation } =
    useContext(PlacesContext);
  const { map, getRouteBetweenPoints } = useContext(MapContext);

  const [activeId, setActiveId] = useState('');

  const onPlaceClicked = (place: Feature) => {
    const [lng, lat] = place.center;
    setActiveId(place.id);
    map?.flyTo({
      zoom: 15,
      center: [lng, lat],
    });
  };

  const getRout = async (place: Feature) => {
    if (!userLocation) throw new Error('No hay ubicación del usuario');
    const [lng, lat] = place.center;
    const info = await getRouteBetweenPoints(userLocation, [lng, lat]);

    const popup = new Popup().setHTML(`
    <p>Hay: ${info.kms} km</p>
    <p>Tarda: ${info.minutes} m</p>
    <p>${place.place_name_es.split(',')[0]}</p>

      `);

    const newMarker = new Marker({
      color: '#0011ff',
    })
      .setPopup(popup)
      .setLngLat([lng, lat])
      .addTo(map!);

    const markerElement = newMarker.getElement(); // Obtener el elemento DOM del marcador

    if (markerElement) {
      markerElement.addEventListener('click', async () => {
        // Manejar el evento de clic
        try {
          const info = await getRouteBetweenPoints(userLocation, [lng, lat]); // Llamar a la función getRout con el lugar seleccionado
          popup.setHTML(`
            <p>${place.place_name_es.split(',')[0]}</p>
            <p>Hay: ${info.kms} km</p>
            <p>Tarda: ${info.minutes} m</p>
              `);
        } catch (error) {
          console.error(error);
        }
      });
    }
  };

  if (isLoadingPlacesOrder) {
    return <LoadingPlaces />;
  }
  if (placesOrder.length === 0) {
    return <></>;
  }

  return (
    <ul className="mt-3">
      {placesOrder.map((place) => (
        <li
          key={place.id}
          className={`cursor-pointer ${
            activeId === place.id ? 'bg-blue-500 text-white' : 'bg-white'
          } border border-gray-200 py-2 px-4 flex justify-between items-center`}
          onClick={() => onPlaceClicked(place)}
        >
          {/* <h6>{place.text_es}</h6> */}
          <p
            style={{
              fontSize: '12px',
            }}
          >
            {place.place_name.split(',')[0]},{' '}
          </p>
          <button
            onClick={() => {
              getRout(place);
            }}
            className={`text-sm py-1 px-2 border rounded ${
              activeId === place.id
                ? 'border-white text-white bg-transparent'
                : 'border-blue-500 text-blue-500 bg-white hover:bg-blue-100'
            }`}
          >
            Direcciones
          </button>
        </li>
      ))}
    </ul>
  );
};
