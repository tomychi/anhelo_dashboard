import axios from 'axios';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

const searchApi = axios.create({
  baseURL: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  params: {
    limit: 5,
    language: 'es',
    access_token: accessToken,
  },
});

export default searchApi;
