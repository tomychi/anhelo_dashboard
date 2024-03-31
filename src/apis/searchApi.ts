import axios from 'axios';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

// const boundingBox = [
//   -64.34782155915593, -33.212109831664975, -64.33153871410627,
//   -32.992145892759154,
// ];

const minLon = -64.5; // Longitud mínima
const minLat = -33.5; // Latitud mínima
const maxLon = -64.0; // Longitud máxima
const maxLat = -33.0; // Latitud máxima

const boundingBox = `${minLon},${minLat},${maxLon},${maxLat}`;

const searchApi = axios.create({
  baseURL: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  params: {
    limit: 5,
    language: 'es',
    access_token: accessToken,
    country: 'AR',
    autocomplete: true,
    bbox: boundingBox,
  },
});

export default searchApi;
