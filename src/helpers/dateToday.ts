import { PedidoProps } from "../types/types";

export const obtenerFechaActual = () => {
	const fechaActual = new Date();
	const dia = String(fechaActual.getDate()).padStart(2, "0");
	const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
	const anio = fechaActual.getFullYear();

	// Formatea la fecha como "DD/MM/AAAA"
	const fechaFormateada = `${dia}/${mes}/${anio}`;

	return fechaFormateada;
};

export const formatDate = (date: Date): string => {
	const year = date.getFullYear().toString();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const convertDateFormat = (dateString: string) => {
	// Suponiendo que el formato actual es 'dd/mm/yyyy'
	const parts = dateString.split("/");
	const year = parts[2];
	const month = parts[1];
	const day = parts[0];
	// Devuelve la fecha en formato 'yyyy-mm-dd'
	return `${year}-${month}-${day}`;
};

export const obtenerHoraActual = (): string => {
	// Obtener la hora actual
	const ahora = new Date();

	// Sumar 5 minutos
	ahora.setMinutes(ahora.getMinutes());

	// Obtener las horas y los minutos
	const horas = ahora.getHours().toString().padStart(2, "0");
	const minutos = ahora.getMinutes().toString().padStart(2, "0");

	// Formatear la hora como 'HH:mm'
	const horaFormateada = horas + ":" + minutos;

	return horaFormateada;
};

export const obtenerDiferenciaHoraria = (hora: string): string => {
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

	// Formatear la diferencia horaria como "HH:mm"
	let horaFormateada = `${horasDiferencia
		.toString()
		.padStart(2, "0")}:${minutosDiferencia.toString().padStart(2, "0")}`;

	// Agregar signo negativo si es necesario
	if (esNegativa) {
		horaFormateada = "-" + horaFormateada;
	}

	return horaFormateada;
};

export const obtenerMinutosDesdeTiempo = (tiempo: string) => {
	const [horas, minutos] = tiempo.split(":").map(Number);
	return horas * 60 + minutos;
};

export const calcularPromedioTiempoElaboracion = (pedidos: PedidoProps[]) => {
	// Filtrar los pedidos que tienen la propiedad tiempoElaborado
	const pedidosConTiempo = pedidos.filter((pedido) => pedido.tiempoElaborado);

	// Verificar si hay pedidos con tiempo de elaboración
	if (pedidosConTiempo.length === 0) {
		return 0; // Si no hay pedidos con tiempo de elaboración, devolver 0 como promedio
	}

	// Calcular el promedio del tiempo de elaboración
	const totalTiempoElaboracion = pedidosConTiempo.reduce((total, pedido) => {
		const tiempoEnMinutos = obtenerMinutosDesdeTiempo(pedido.tiempoElaborado);
		return total + tiempoEnMinutos;
	}, 0);

	const cantidadPedidos = pedidosConTiempo.length;
	const promedio = totalTiempoElaboracion / cantidadPedidos;

	return promedio;
};
export const promedioTiempoDeEntregaTotal = (pedidos: PedidoProps[]) => {
	// Filtrar los pedidos que tienen la propiedad tiempoEntregado y hora definidas
	const pedidosConTiempo = pedidos.filter(
		(pedido) => pedido.tiempoEntregado && pedido.hora
	);

	// Verificar si hay pedidos con tiempo de entrega y hora
	if (pedidosConTiempo.length === 0) {
		return 0; // Devolver 0 como promedio si no hay pedidos con tiempo de entrega y hora
	}

	// Calcular el total del tiempo de entrega de todos los pedidos en minutos
	const totalTiempoEntrega = pedidosConTiempo.reduce((total, pedido) => {
		// Convertir los tiempos a minutos y calcular la diferencia
		const tiempoEntregaMinutos = obtenerMinutosDesdeTiempo(
			pedido.tiempoEntregado
		);
		const tiempoPedidoMinutos = obtenerMinutosDesdeTiempo(pedido.hora);
		const diferenciaTiempo = tiempoEntregaMinutos - tiempoPedidoMinutos;

		if (diferenciaTiempo < 0) {
			return total + 1440 + diferenciaTiempo;
		}

		// Sumar la diferencia al total
		return total + diferenciaTiempo;
	}, 0);

	// Calcular el promedio dividiendo el total por la cantidad de pedidos
	const cantidadPedidos = pedidosConTiempo.length;
	const promedio = totalTiempoEntrega / cantidadPedidos;

	return promedio;
};

export const contarPedidosDemorados = (pedidos: PedidoProps[]) => {
	// Filtrar los pedidos que tienen la propiedad tiempoEntregado y hora definidas
	const pedidosConTiempo = pedidos.filter(
		(pedido) => pedido.tiempoEntregado && pedido.hora
	);

	// Contador para la cantidad de pedidos demorados
	let cantidadDemorados = 0;

	// Iterar sobre los pedidos y contar los que demoraron más de 60 minutos
	pedidosConTiempo.forEach((pedido) => {
		// Convertir los tiempos a minutos y calcular la diferencia
		const tiempoEntregaMinutos = obtenerMinutosDesdeTiempo(
			pedido.tiempoEntregado
		);
		const tiempoPedidoMinutos = obtenerMinutosDesdeTiempo(pedido.hora);
		const diferenciaTiempo = tiempoEntregaMinutos - tiempoPedidoMinutos;

		// Incrementar el contador si la diferencia es mayor a 60 minutos
		if (diferenciaTiempo > 60) {
			cantidadDemorados++;
		}
	});

	return cantidadDemorados;
};

// export function calcularDiferenciaHoraria(horaInicio: string, horaFin: string) {
//   // Convierte una hora en formato HH:MM a minutos totales
//   function convertirHoraAMinutos(hora: string) {
//     const [horas, minutos] = hora.split(':').map(Number);
//     return horas * 60 + minutos;
//   }

//   const minutosInicio = convertirHoraAMinutos(horaInicio);
//   const minutosFin = convertirHoraAMinutos(horaFin);

//   const diferenciaMinutos = minutosFin - minutosInicio;

//   // Calcula la diferencia en horas y minutos
//   const horas = Math.floor(diferenciaMinutos / 60);
//   const minutos = diferenciaMinutos % 60;

//   return `${horas} horas y ${minutos} minutos`;
// }

const convertirHoraAMinutos = (hora: string) => {
	const [horas, minutos] = hora.split(":").map(Number);
	return horas * 60 + minutos;
};

export const calcularDiferenciaHoraria = (
	horaInicio: string,
	horaFin: string
) => {
	const minutosInicio = convertirHoraAMinutos(horaInicio);
	const minutosFin = convertirHoraAMinutos(horaFin);

	return minutosFin - minutosInicio;
};

export const calcularPromedioTiempoPorViaje = (
	horaSalida: string,
	horaLlegada: string,
	cantidadDeViajes: number
) => {
	if (!horaSalida || !horaLlegada || cantidadDeViajes === 0) {
		return "N/A";
	}

	const diferenciaMinutos = calcularDiferenciaHoraria(horaSalida, horaLlegada);
	const promedioMinutosPorViaje = diferenciaMinutos / cantidadDeViajes;

	const horas = Math.floor(promedioMinutosPorViaje / 60);
	const minutos = Math.round(promedioMinutosPorViaje % 60);

	return `${horas} horas y ${minutos} minutos por pedido`;
};
