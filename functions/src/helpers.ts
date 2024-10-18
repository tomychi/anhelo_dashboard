export const obtenerHoraActual = () => {
  const ahora = new Date();

  const opciones: Intl.DateTimeFormatOptions = {
    hour: "2-digit", // Formato de dos dígitos para la hora
    minute: "2-digit", // Formato de dos dígitos para los minutos
    timeZone: "America/Argentina/Buenos_Aires", // Zona horaria de Buenos Aires
    hour12: false, // Formato 24 horas
  };

  // Formatea la hora como "HH:mm"
  const horaFormateada = new Intl.DateTimeFormat("es-AR", opciones).format(
    ahora,
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
    day: "2-digit", // Formato de dos dígitos para el día
    month: "2-digit", // Formato de dos dígitos para el mes
    year: "numeric", // Año completo en formato numérico
    timeZone: "America/Argentina/Buenos_Aires", // Zona horaria de Buenos Aires
  };

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = new Intl.DateTimeFormat("es-AR", opciones).format(
    fechaActual,
  );

  return fechaFormateada; // Retorna la fecha en el formato deseado
};
