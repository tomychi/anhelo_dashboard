import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import data from '../assets/pedidos.json';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

interface DataMapsProps {
  address: string;
  coordinates: number[];
}

export const MapStats = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  console.log(mapLoaded);
  const tuCiudadCoordinates = [-64.347558, -33.117876];

  const ciudadLongitud = tuCiudadCoordinates[0];
  const ciudadLatitud = tuCiudadCoordinates[1];
  const radio = 0.1; // Define el radio en grados de latitud y longitud (ajusta esto según la extensión deseada)

  const bbox = [
    ciudadLongitud - radio,
    ciudadLatitud - radio,
    ciudadLongitud + radio,
    ciudadLatitud + radio,
  ].join(',');

  useEffect(() => {
    mapboxgl.accessToken = accessToken;

    const getStoredMapData = () => {
      const storedData = localStorage.getItem('mapData');
      return storedData ? JSON.parse(storedData) : null;
    };

    const saveMapData = (data: DataMapsProps[]) => {
      localStorage.setItem('mapData', JSON.stringify(data));
    };

    const geocodeAddresses = async () => {
      const storedMapData = getStoredMapData();
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [tuCiudadCoordinates[0], tuCiudadCoordinates[1]],
        zoom: 9,
      });

      if (!storedMapData) {
        for (const item of storedMapData) {
          new mapboxgl.Marker({
            color: '#ff0000',
            scale: 0.2,
          })
            .setLngLat(item.coordinates)
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>${item.address}</h3>`))
            .addTo(map);
        }
        setMapLoaded(true);
      } else {
        const geocodedData = [];

        for (const item of data) {
          const address = encodeURIComponent(item.direccion);
          const endpoint = 'mapbox.places';
          const proximity = `${tuCiudadCoordinates[0]},${tuCiudadCoordinates[1]}`;
          const url = `https://api.mapbox.com/geocoding/v5/${endpoint}/${address}.json?access_token=${mapboxgl.accessToken}&proximity=${proximity}&bbox=${bbox}`;

          try {
            const response = await fetch(url);
            const geodata = await response.json();
            const coordinates = geodata.features[0].geometry.coordinates;

            geocodedData.push({
              coordinates: coordinates,
              address: item.direccion,
            });

            new mapboxgl.Marker({
              color: '#ff0000',
              scale: 0.2,
            })
              .setLngLat(coordinates)
              .setPopup(
                new mapboxgl.Popup().setHTML(`<h3>${item.direccion}</h3>`)
              )
              .addTo(map);
          } catch (error) {
            console.error('Error al obtener coordenadas:', error);
          }
        }
        saveMapData(geocodedData);
        setMapLoaded(true);
      }
    };

    geocodeAddresses();
  }, []);

  return <div id="map" className="h-screen w-screen"></div>;
};
