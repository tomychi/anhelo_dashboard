// devuelve una promesa [number,number]
export const getUserLocation = async (): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // resolve([coords.longitude, coords.latitude]); user con gps
        resolve([-64.3337858210026, -33.0957943618745]);
      },
      (error) => {
        alert('No se pudo obtener la ubicación');
        console.log(error);
        reject();
      }
    );
  });
};
