import { useContext, useState } from 'react';
import { LoadingPlaces } from './';
import { MapContext, PlacesContext } from '../../context';
import { Feature } from '../../interfaces/places';

export const SearchResults = () => {
  const { places, isLoadingPlaces, userLocation } = useContext(PlacesContext);
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

  const getRout = (place: Feature) => {
    if (!userLocation) throw new Error('No hay ubicación del usuario');
    const [lng, lat] = place.center;
    getRouteBetweenPoints(userLocation, [lng, lat]);
  };

  if (isLoadingPlaces) {
    return <LoadingPlaces />;
  }
  if (places.length === 0) {
    return <></>;
  }

  return (
    <ul className="list-group mt-3">
      {places.map((place) => (
        <li
          key={place.id}
          className={`list-group-item list-group-item-action pointer ${
            activeId === place.id ? 'active' : ''
          }`}
          onClick={() => onPlaceClicked(place)}
        >
          <h6>{place.text_es}</h6>
          <p
            style={{
              fontSize: '12px',
            }}
          >
            {place.place_name}
          </p>
          <button
            onClick={() => {
              getRout(place);
            }}
            className={`btn btn-sm ${
              activeId === place.id
                ? 'btn-outline-light'
                : 'btn-outline-primary'
            }`}
          >
            Direcciones
          </button>
        </li>
      ))}
    </ul>
  );
};
