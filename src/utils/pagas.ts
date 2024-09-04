import { fetchConstants } from '../firebase/Cadetes';
import { Vuelta } from '../types/types';

export const calcularPagaPorUnaVuelta = async (vuelta: Vuelta) => {
  const cadetesData = await fetchConstants();

  if (!cadetesData) {
    console.error('No se pudieron obtener los datos de sueldos');
    return 0;
  }

  const puntosDeEntrega = vuelta.orders.length;
  const pagaPorPuntosDeEntrega =
    puntosDeEntrega * cadetesData.precioPuntoEntrega;
  const pagaPorKmRecorridos = vuelta.totalDistance * cadetesData.precioPorKM;

  const pagaVuelta = pagaPorPuntosDeEntrega + pagaPorKmRecorridos;

  // Puedes descomentar el siguiente bloque si quieres ver el desglose en consola.
  // console.log(`
  //   Puntos de Entrega: $${pagaPorPuntosDeEntrega} (${puntosDeEntrega} puntos)
  //   Km recorridos: $${pagaPorKmRecorridos.toFixed(
  //     2
  //   )} (${vuelta.totalDistance.toFixed(2)} km)
  //   Total de la vuelta: $${pagaVuelta.toFixed(2)}
  // `);

  return pagaVuelta;
};
