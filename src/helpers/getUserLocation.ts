export const getUserLocation = async (): Promise<[number, number]> => {
  // Versión usando navigator (comentada)
  // return new Promise((resolve, reject) => {
  //   navigator.geolocation.getCurrentPosition(
  //     ({ coords }) => {
  //       resolve([coords.longitude, coords.latitude]);
  //     },
  //     (error) => {
  //       alert('No se pudo obtener la ubicación');
  //       console.log(error);
  //       reject();
  //     }
  //   );
  // });

  // Versión sin navigator (devuelve coordenadas fijas)
  return Promise.resolve([-64.3337858210026, -33.0957943618745]);
};
