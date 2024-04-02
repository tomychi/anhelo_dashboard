import axios from 'axios';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

export const mapClickFn = (coordinates: { lng: number; lat: number }) => {
  return new Promise<string>((resolve, reject) => {
    const url =
      'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
      coordinates.lng +
      ',' +
      coordinates.lat +
      '.json?access_token=' +
      accessToken;

    axios
      .get(url)
      .then((response) => {
        const data = response.data;
        if (data.features.length > 0) {
          const address = data.features[0].place_name.split(',')[0];
          resolve(address); // Resuelve la promesa con la dirección obtenida
        } else {
          resolve('No address found'); // Resuelve la promesa con el mensaje de dirección no encontrada
        }
      })
      .catch((error) => {
        console.error('Error fetching address:', error);
        reject(error); // Rechaza la promesa con el error obtenido
      });
  });
};
