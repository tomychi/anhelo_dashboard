import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import data from '../assets/combined_addresses.json';

const accessToken =
  'pk.eyJ1IjoidG9teWNoaTEwIiwiYSI6ImNscGo1bDlsdDA1eTkyb240cmM3N2k4MGQifQ.o_0Lb8CoKuxI5PD5ETsOSg';

export const MapStats = () => {
  useEffect(() => {
    mapboxgl.accessToken = accessToken;

    const geocodeAddress = async () => {
      // reemplazamos con la dirección que deseas geocodificar
      const address = 'felipe neri guerra 352';
      const endpoint = 'mapbox.places';
      const search_text = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/${endpoint}/${search_text}.json?access_token=${mapboxgl.accessToken}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        // Obtener las coordenadas de la primera coincidencia
        const coordinates = data.features[0].geometry.coordinates;
        console.log('Coordenadas:', coordinates);

        // Inicializar el mapa
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/dark-v11',
          center: coordinates,
          zoom: 12,
        });

        // agregar marcador al mapa en las coordenadas obtenidas
        new mapboxgl.Marker().setLngLat(coordinates).addTo(map);
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
      }
    };

    geocodeAddress();
  }, []);
  return <div id="map" className="h-screen w-screen"></div>;
};
