export default function currencyFormat(num: number) {
  if (num === null) {
    return '0'; // O cualquier otro valor predeterminado que desees devolver si el valor es nulo
  }
  const aux = num.toFixed(2);
  let result = '$' + aux.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

  // Verificar si los últimos dos caracteres son "00" y eliminarlos si es necesario
  if (result.endsWith('00')) {
    result = result.slice(0, -3); // Eliminar los últimos dos caracteres
  }

  return result;
}
