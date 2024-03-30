import axios from 'axios';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

const directionsApi = axios.create({
  baseURL: 'https://api.mapbox.com/directions/v5/mapbox/driving',
  params: {
    alternatives: false,
    geometries: 'geojson',
    overview: 'simplified',
    steps: false,
    access_token: accessToken,
  },
});

export default directionsApi;
