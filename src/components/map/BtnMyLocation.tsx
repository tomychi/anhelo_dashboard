import { useContext } from 'react';
import { MapContext, PlacesContext } from '../../context';

export const BtnMyLocation = () => {
  const { map, isMapReady } = useContext(MapContext);
  const { userLocation } = useContext(PlacesContext);

  const onClick = () => {
    if (!isMapReady) throw new Error('Mapa no está listo');
    if (!userLocation) throw new Error('No hay ubicación del usuario');

    map?.flyTo({
      zoom: 15,
      center: userLocation,
    });
  };

  return (
    <div
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999,
      }}
    >
      Mi Ubicacion
    </div>
  );
};
