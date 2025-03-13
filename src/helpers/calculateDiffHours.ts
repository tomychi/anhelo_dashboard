// funcion para calcular la diferencia de minutos entre la hora de entradad del pedido y la hora actual, para asignarle un color al pedido

export const colorsPedido = {
  green: "#00FF00",
  yellow: "#FFD700",
  red: "#FF0000",
  gray: "#D3D3D3",
};

export const obtenerDiferenciaHorariaWithColor = (hora: string): string => {
  // Obtener la hora actual
  const ahora = new Date();

  // Dividir la hora en horas y minutos
  const [horas, minutos] = hora.split(":").map(Number);

  // Establecer la hora actual
  ahora.setHours(horas);
  ahora.setMinutes(minutos);

  // Obtener la diferencia horaria en milisegundos
  const diferenciaHoraria = Date.now() - ahora.getTime();

  // Verificar si la diferencia es negativa
  const esNegativa = diferenciaHoraria < 0;

  // Calcular las horas y minutos de la diferencia horaria (usando el valor absoluto)
  const horasDiferencia = Math.floor(
    Math.abs(diferenciaHoraria) / (1000 * 60 * 60)
  );
  const minutosDiferencia = Math.floor(
    (Math.abs(diferenciaHoraria) % (1000 * 60 * 60)) / (1000 * 60)
  );

  // Agregar signo negativo si es necesario
  if (esNegativa) {
    return colorsPedido.gray;
  }

  if (horasDiferencia) {
    return colorsPedido.red;
  }

  // sino tomamos los minutos despues del : y los comparamos
  // si es menor a 10 min devolvemos verde
  // si es menor a 20 min devolvemos amarillo
  // si es mayor a 20 min devolvemos rojo
  if (minutosDiferencia < 10) {
    return colorsPedido.green;
  } else if (minutosDiferencia < 20) {
    return colorsPedido.yellow;
  } else {
    return colorsPedido.red;
  }
};

const coloresTailwind: { [key: string]: string } = {
  [colorsPedido.green]: "bg-green-500",
  [colorsPedido.yellow]: "bg-yellow-500",
  [colorsPedido.red]: "bg-custom-red",
  [colorsPedido.gray]: "bg-gray-400 ",
};
export const obtenerColorTailwind = (colorHexadecimal: string) => {
  return coloresTailwind[colorHexadecimal] || "custom"; // Si el color no está en la lista, se utiliza un nombre de color personalizado
};
