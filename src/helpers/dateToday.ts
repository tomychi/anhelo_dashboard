export const obtenerFechaActual = () => {
  const fechaActual = new Date();
  const dia = String(fechaActual.getDate()).padStart(2, '0');
  const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
  const anio = fechaActual.getFullYear();

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  return fechaFormateada;
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const obtenerHoraActual = (): string => {
  // Obtener la hora actual
  const ahora = new Date();

  // Sumar 5 minutos
  ahora.setMinutes(ahora.getMinutes());

  // Obtener las horas y los minutos
  const horas = ahora.getHours().toString().padStart(2, '0');
  const minutos = ahora.getMinutes().toString().padStart(2, '0');

  // Formatear la hora como 'HH:mm'
  const horaFormateada = horas + ':' + minutos;

  return horaFormateada;
};

export const obtenerDiferenciaHoraria = (hora: string): string => {
  // Obtener la hora actual
  const ahora = new Date();

  // Dividir la hora en horas y minutos
  const [horas, minutos] = hora.split(':').map(Number);

  // Establecer la hora actual
  ahora.setHours(horas);
  ahora.setMinutes(minutos);

  // Obtener la diferencia horaria en milisegundos
  const diferenciaHoraria = ahora.getTime() - Date.now();

  // Calcular las horas y minutos de la diferencia horaria
  const horasDiferencia = Math.floor(
    Math.abs(diferenciaHoraria) / (1000 * 60 * 60)
  );
  const minutosDiferencia = Math.floor(
    (Math.abs(diferenciaHoraria) % (1000 * 60 * 60)) / (1000 * 60)
  );

  // Formatear la diferencia horaria como "HH:mm"
  const horaFormateada = `${horasDiferencia
    .toString()
    .padStart(2, '0')}:${minutosDiferencia.toString().padStart(2, '0')}`;

  return horaFormateada;
};
