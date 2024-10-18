export const obtenerHoraActual = () => {
  const ahora = new Date();

  const opciones: Intl.DateTimeFormatOptions = {
    hour: '2-digit', // Formato de dos dígitos para la hora
    minute: '2-digit', // Formato de dos dígitos para los minutos
    timeZone: 'America/Argentina/Buenos_Aires', // Zona horaria de Buenos Aires
    hour12: false, // Formato 24 horas
  };

  // Formatea la hora como "HH:mm"
  const horaFormateada = new Intl.DateTimeFormat('es-AR', opciones).format(
    ahora
  );

  return horaFormateada; // Retorna la hora en el formato deseado
};

export const extractCoordinates = (url: string) => {
  const regex = /maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = url.match(regex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    return [lat, lng];
  }
  return [0, 0]; // Valor predeterminado si no se encuentran coordenadas
};

export const obtenerFechaActual = () => {
  const fechaActual = new Date();

  const opciones: Intl.DateTimeFormatOptions = {
    day: '2-digit', // Formato de dos dígitos para el día
    month: '2-digit', // Formato de dos dígitos para el mes
    year: 'numeric', // Año completo en formato numérico
    timeZone: 'America/Argentina/Buenos_Aires', // Zona horaria de Buenos Aires
  };

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = new Intl.DateTimeFormat('es-AR', opciones).format(
    fechaActual
  );

  return fechaFormateada; // Retorna la fecha en el formato deseado
};

export const cleanPhoneNumber = (phoneNumber: string) => {
  // Asegurarse de que phoneNumber es una cadena
  const phoneStr = String(phoneNumber);
  // Remover todo excepto los dígitos
  const digitsOnly = phoneStr.replace(/\D/g, '');
  // Si el número comienza con "54", eliminarlo
  const without54 = digitsOnly.startsWith('54')
    ? digitsOnly.slice(2)
    : digitsOnly;
  // Si el número comienza con "9", eliminarlo
  const without9 = without54.startsWith('9') ? without54.slice(1) : without54;
  // Si el número comienza con "0", eliminarlo
  const without0 = without9.startsWith('0') ? without9.slice(1) : without9;
  // Retornar el número limpio
  return without0;
};
