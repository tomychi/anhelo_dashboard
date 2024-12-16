// import { PedidoProps } from "../types/types";

// interface SimulationResult {
// 	customerSuccess: number;
// 	tiempoPromedioEntrega: number;
// 	costoPorEntrega: number;
// 	gruposFormados: number;
// 	pedidosEntregados: number;
// 	grupos: Grupo[];
// }

// interface Grupo {
// 	pedidos: PedidoProps[];
// 	tiempoTotal: number;
// 	distanciaTotal: number;
// 	customerSuccess: number;
// 	costoPromedio: number;
// 	tiempoRegreso?: string;
// }

// // private pedidosAsignados = new Set<string>();

// export class OptimizadorComandas {
// 	private LATITUD_BASE = -33.0957994;
// 	private LONGITUD_BASE = -64.3337817;
// 	private FACTOR_CORRECCION_DISTANCIA = 1.455;

// 	private configuracion = {
// 		tiempoMaximoEntrega: 40, // minutos
// 		velocidadPromedio: 27, // km/h
// 		costoBase: 1200, // por entrega
// 		costoPorKm: 200, // por km
// 		maxPedidosPorGrupo: 4, // máximo de pedidos por grupo
// 	};

// 	async simularDia(
// 		pedidosHistoricos: PedidoProps[]
// 	): Promise<SimulationResult> {
// 		this.pedidosAsignados.clear(); // Reset al inicio
// 		const grupos: Grupo[] = [];

// 		// Ordenar pedidos por prioridad y hora
// 		const pedidosOrdenados =
// 			this.ordenarPedidosPorPrioridadYHora(pedidosHistoricos);

// 		// Creamos grupos hasta procesar todos los pedidos
// 		let pedidosRestantes = [...pedidosOrdenados];
// 		while (pedidosRestantes.length > 0) {
// 			const horaActual = new Date();
// 			horaActual.setHours(11, 0, 0, 0); // Comenzamos a las 11

// 			const grupo = this.formarMejorGrupo(pedidosRestantes, horaActual);

// 			if (grupo.pedidos.length > 0) {
// 				grupos.push(grupo);
// 				// Marcar pedidos como asignados y actualizar restantes
// 				grupo.pedidos.forEach((p) => this.pedidosAsignados.add(p.id));
// 				pedidosRestantes = pedidosRestantes.filter(
// 					(p) => !this.pedidosAsignados.has(p.id)
// 				);
// 			} else {
// 				break;
// 			}
// 		}

// 		return {
// 			customerSuccess: this.calcularCustomerSuccessGlobal(grupos),
// 			tiempoPromedioEntrega: this.calcularTiempoPromedioGlobal(grupos),
// 			costoPorEntrega: this.calcularCostoPromedioGlobal(grupos),
// 			gruposFormados: grupos.length,
// 			pedidosEntregados: pedidosHistoricos.length,
// 			grupos,
// 		};
// 	}

// 	private ordenarPedidosPorPrioridadYHora(
// 		pedidos: PedidoProps[]
// 	): PedidoProps[] {
// 		const horaActual = new Date();
// 		horaActual.setHours(11, 0, 0, 0);

// 		return [...pedidos].sort((a, b) => {
// 			// Primero por tiempo de espera
// 			const tiempoEsperaA = this.calcularTiempoEsperaReal(a.hora, horaActual);
// 			const tiempoEsperaB = this.calcularTiempoEsperaReal(b.hora, horaActual);

// 			if (Math.abs(tiempoEsperaA - tiempoEsperaB) > 10) {
// 				return tiempoEsperaB - tiempoEsperaA;
// 			}

// 			// Si los tiempos son similares, por elaboración
// 			if (a.elaborado !== b.elaborado) {
// 				return a.elaborado ? -1 : 1;
// 			}

// 			// Si todo es igual, por hora original
// 			const [horaA, minA] = a.hora.split(":").map(Number);
// 			const [horaB, minB] = b.hora.split(":").map(Number);
// 			return horaA * 60 + minA - (horaB * 60 + minB);
// 		});
// 	}

// 	private generarIntervalos(
// 		pedidos: PedidoProps[]
// 	): { pedidos: PedidoProps[]; horaActual: Date }[] {
// 		const intervalos: { pedidos: PedidoProps[]; horaActual: Date }[] = [];
// 		let horaInicio = new Date();
// 		horaInicio.setHours(11, 0, 0, 0); // Comenzamos a las 11:00

// 		while (horaInicio.getHours() < 23) {
// 			// Hasta las 23:00
// 			const pedidosIntervalo = pedidos.filter((pedido) => {
// 				const [hora, minutos] = pedido.hora.split(":").map(Number);
// 				const horaPedido = new Date(horaInicio);
// 				horaPedido.setHours(hora, minutos);
// 				return horaPedido <= horaInicio;
// 			});

// 			if (pedidosIntervalo.length > 0) {
// 				intervalos.push({
// 					pedidos: pedidosIntervalo,
// 					horaActual: new Date(horaInicio),
// 				});
// 			}

// 			horaInicio = new Date(horaInicio.getTime() + 15 * 60000); // Avanzar 15 minutos
// 		}

// 		return intervalos;
// 	}

// 	private optimizarGrupos(pedidos: PedidoProps[], horaActual: Date): Grupo[] {
// 		const grupos: Grupo[] = [];
// 		let pedidosRestantes = [...pedidos];

// 		// Ordenar pedidos por prioridad y tiempo de espera
// 		pedidosRestantes.sort((a, b) => {
// 			const prioridadA = this.calcularPrioridad(a, horaActual);
// 			const prioridadB = this.calcularPrioridad(b, horaActual);
// 			if (Math.abs(prioridadA - prioridadB) < 10) {
// 				// Si las prioridades son similares, ordenar por tiempo de espera
// 				const tiempoEsperaA = this.calcularTiempoEsperaReal(a.hora, horaActual);
// 				const tiempoEsperaB = this.calcularTiempoEsperaReal(b.hora, horaActual);
// 				return tiempoEsperaB - tiempoEsperaA;
// 			}
// 			return prioridadB - prioridadA;
// 		});

// 		// Agrupar pedidos
// 		while (pedidosRestantes.length > 0) {
// 			// Limitar tamaño de grupo basado en tiempos de espera
// 			const tiempoEsperaMayor = this.calcularTiempoEsperaReal(
// 				pedidosRestantes[0].hora,
// 				horaActual
// 			);
// 			const maxGrupoSize =
// 				tiempoEsperaMayor > 25
// 					? 3
// 					: tiempoEsperaMayor > 15
// 					? 4
// 					: this.configuracion.maxPedidosPorGrupo;

// 			const grupo = this.formarMejorGrupo(
// 				pedidosRestantes,
// 				horaActual,
// 				maxGrupoSize
// 			);

// 			if (grupo.pedidos.length > 0) {
// 				grupos.push(grupo);
// 				pedidosRestantes = pedidosRestantes.filter(
// 					(p) => !grupo.pedidos.find((gp) => gp.id === p.id)
// 				);
// 			} else {
// 				break;
// 			}
// 		}

// 		return grupos;
// 	}

// 	private formarMejorGrupo(
// 		pedidosDisponibles: PedidoProps[],
// 		horaActual: Date
// 	): Grupo {
// 		const pedidoInicial = this.encontrarPedidoInicial(
// 			pedidosDisponibles,
// 			horaActual
// 		);
// 		if (!pedidoInicial) return this.crearGrupoVacio();

// 		let mejorGrupo: PedidoProps[] = [pedidoInicial];
// 		let mejorPuntaje = this.calcularPuntajeGrupo(
// 			this.calcularMetricasGrupo([pedidoInicial], horaActual)
// 		);

// 		const candidatos = pedidosDisponibles.filter(
// 			(p) => !this.pedidosAsignados.has(p.id) && p.id !== pedidoInicial.id
// 		);

// 		// Intentar todas las combinaciones posibles hasta 4 pedidos
// 		for (
// 			let i = 0;
// 			i < candidatos.length &&
// 			mejorGrupo.length < this.configuracion.maxPedidosPorGrupo;
// 			i++
// 		) {
// 			const grupoTentativo = [...mejorGrupo, candidatos[i]];
// 			const metricas = this.calcularMetricasGrupo(grupoTentativo, horaActual);
// 			const puntaje = this.calcularPuntajeGrupo(metricas);

// 			if (
// 				puntaje > mejorPuntaje &&
// 				metricas.customerSuccess > 0 &&
// 				metricas.tiempoTotal <= this.configuracion.tiempoMaximoEntrega
// 			) {
// 				mejorGrupo = grupoTentativo;
// 				mejorPuntaje = puntaje;
// 			}
// 		}

// 		return this.calcularMetricasGrupo(mejorGrupo, horaActual);
// 	}

// 	private encontrarPedidoInicial(
// 		pedidos: PedidoProps[],
// 		horaActual: Date
// 	): PedidoProps | null {
// 		return pedidos.reduce((mejor, actual) => {
// 			if (!mejor) return actual;

// 			const prioridadMejor = this.calcularPrioridad(mejor, horaActual);
// 			const prioridadActual = this.calcularPrioridad(actual, horaActual);

// 			return prioridadActual > prioridadMejor ? actual : mejor;
// 		}, null as PedidoProps | null);
// 	}

// 	private encontrarMejorCandidato(
// 		grupoActual: PedidoProps[],
// 		candidatos: PedidoProps[],
// 		horaActual: Date
// 	): PedidoProps | null {
// 		let mejorCandidato = null;
// 		let mejorPuntaje = -Infinity;

// 		for (const candidato of candidatos) {
// 			const grupoSimulado = [...grupoActual, candidato];
// 			const metricas = this.calcularMetricasGrupo(grupoSimulado, horaActual);
// 			const puntaje = this.calcularPuntajeGrupo(metricas);

// 			if (
// 				puntaje > mejorPuntaje &&
// 				metricas.tiempoTotal <= this.configuracion.tiempoMaximoEntrega
// 			) {
// 				mejorPuntaje = puntaje;
// 				mejorCandidato = candidato;
// 			}
// 		}

// 		return mejorCandidato;
// 	}

// 	private calcularPrioridad(pedido: PedidoProps, horaActual: Date): number {
// 		let prioridad = 0;

// 		// Prioridad por tiempo de espera
// 		const tiempoEspera = this.calcularTiempoEsperaReal(pedido.hora, horaActual);
// 		if (tiempoEspera > 30) prioridad += 100;
// 		else if (tiempoEspera > 20) prioridad += 50;
// 		else if (tiempoEspera > 15) prioridad += 25;

// 		// Prioridad por elaboración
// 		if (pedido.elaborado) prioridad += 30;

// 		// Factor distancia
// 		if (pedido.map && pedido.map.length === 2) {
// 			const distancia = this.calcularDistancia(
// 				this.LATITUD_BASE,
// 				this.LONGITUD_BASE,
// 				pedido.map[0],
// 				pedido.map[1]
// 			);
// 			prioridad -= distancia * 2; // Penalización por distancia
// 		}

// 		return prioridad;
// 	}

// 	private calcularMetricasGrupo(grupo: PedidoProps[], horaActual: Date): Grupo {
// 		let distanciaTotal = 0;
// 		let tiempoTotal = 0;
// 		let latitudActual = this.LATITUD_BASE;
// 		let longitudActual = this.LONGITUD_BASE;

// 		// Agregamos tiempo base por preparación
// 		const TIEMPO_BASE_PREPARACION = 5; // 5 minutos base por grupo
// 		tiempoTotal += TIEMPO_BASE_PREPARACION;

// 		// Calcular ruta con límites razonables
// 		for (const pedido of grupo) {
// 			if (pedido.map && pedido.map.length === 2) {
// 				const distancia = this.calcularDistancia(
// 					latitudActual,
// 					longitudActual,
// 					pedido.map[0],
// 					pedido.map[1]
// 				);

// 				// Verificar que la distancia sea razonable (máximo 15km por tramo)
// 				const distanciaAjustada = Math.min(distancia, 15);
// 				distanciaTotal += distanciaAjustada;

// 				// Tiempo de viaje + tiempo fijo por entrega
// 				const tiempoViaje =
// 					(distanciaAjustada / this.configuracion.velocidadPromedio) * 60;
// 				const TIEMPO_POR_ENTREGA = 3; // 3 minutos por entrega
// 				tiempoTotal += tiempoViaje + TIEMPO_POR_ENTREGA;

// 				latitudActual = pedido.map[0];
// 				longitudActual = pedido.map[1];
// 			}
// 		}

// 		// Limitar el tiempo total por grupo
// 		tiempoTotal = Math.min(tiempoTotal, this.configuracion.tiempoMaximoEntrega);

// 		return {
// 			pedidos: grupo,
// 			tiempoTotal: Math.round(tiempoTotal),
// 			distanciaTotal: Math.round(distanciaTotal * 100) / 100,
// 			customerSuccess: this.calcularCustomerSuccessGrupo(
// 				grupo,
// 				tiempoTotal,
// 				horaActual
// 			),
// 			costoPromedio: this.calcularCostoPromedioGrupo(
// 				distanciaTotal,
// 				grupo.length
// 			),
// 		};
// 	}

// 	private crearGrupoVacio(): Grupo {
// 		return {
// 			pedidos: [],
// 			tiempoTotal: 0,
// 			distanciaTotal: 0,
// 			customerSuccess: 0,
// 			costoPromedio: 0,
// 		};
// 	}

// 	private calcularDistancia(
// 		lat1: number,
// 		lon1: number,
// 		lat2: number,
// 		lon2: number
// 	): number {
// 		const R = 6371;
// 		const dLat = ((lat2 - lat1) * Math.PI) / 180;
// 		const dLon = ((lon2 - lon1) * Math.PI) / 180;
// 		const a =
// 			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
// 			Math.cos((lat1 * Math.PI) / 180) *
// 				Math.cos((lat2 * Math.PI) / 180) *
// 				Math.sin(dLon / 2) *
// 				Math.sin(dLon / 2);
// 		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// 		return R * c * this.FACTOR_CORRECCION_DISTANCIA;
// 	}

// 	private calcularTiempoEsperaReal(
// 		horaPedido: string,
// 		horaActual: Date
// 	): number {
// 		const [horas, minutos] = horaPedido.split(":").map(Number);
// 		const fechaPedido = new Date(horaActual);
// 		fechaPedido.setHours(horas, minutos, 0, 0);
// 		return Math.floor((horaActual.getTime() - fechaPedido.getTime()) / 60000);
// 	}

// 	private calcularCustomerSuccessGrupo(
// 		grupo: PedidoProps[],
// 		tiempoTotal: number,
// 		horaActual: Date
// 	): number {
// 		const pedidosATiempo = grupo.filter((pedido) => {
// 			const tiempoEspera = this.calcularTiempoEsperaReal(
// 				pedido.hora,
// 				horaActual
// 			);
// 			return (
// 				tiempoEspera + tiempoTotal <= this.configuracion.tiempoMaximoEntrega
// 			);
// 		}).length;

// 		return Math.round((pedidosATiempo / grupo.length) * 100);
// 	}

// 	private calcularCustomerSuccessGlobal(grupos: Grupo[]): number {
// 		const totalPedidos = grupos.reduce(
// 			(sum, grupo) => sum + grupo.pedidos.length,
// 			0
// 		);
// 		const pedidosExitosos = grupos.reduce(
// 			(sum, grupo) =>
// 				sum + (grupo.pedidos.length * grupo.customerSuccess) / 100,
// 			0
// 		);
// 		return Math.round((pedidosExitosos / totalPedidos) * 100);
// 	}

// 	private calcularCostoPromedioGrupo(
// 		distanciaTotal: number,
// 		numPedidos: number
// 	): number {
// 		const costoTotal =
// 			this.configuracion.costoBase * numPedidos +
// 			this.configuracion.costoPorKm * distanciaTotal;
// 		return Math.round(costoTotal / numPedidos);
// 	}

// 	private calcularCostoPromedioGlobal(grupos: Grupo[]): number {
// 		const totalPedidos = grupos.reduce(
// 			(sum, grupo) => sum + grupo.pedidos.length,
// 			0
// 		);
// 		const costoTotal = grupos.reduce(
// 			(sum, grupo) => sum + grupo.costoPromedio * grupo.pedidos.length,
// 			0
// 		);
// 		return Math.round(costoTotal / totalPedidos);
// 	}

// 	private calcularTiempoPromedioGlobal(grupos: Grupo[]): number {
// 		const totalPedidos = grupos.reduce(
// 			(sum, grupo) => sum + grupo.pedidos.length,
// 			0
// 		);
// 		const tiempoTotal = grupos.reduce(
// 			(sum, grupo) => sum + grupo.tiempoTotal * grupo.pedidos.length,
// 			0
// 		);
// 		return Math.round(tiempoTotal / totalPedidos);
// 	}

// 	private calcularPuntajeGrupo(metricas: Grupo): number {
// 		const PESO_CUSTOMER_SUCCESS = 0.6; // Aumentado
// 		const PESO_COSTO = 0.2; // Reducido
// 		const PESO_TIEMPO = 0.2;

// 		const customerSuccessScore = metricas.customerSuccess / 100;
// 		const costoScore = Math.max(0, 1 - (metricas.costoPromedio - 1200) / 1800); // Normalizado entre 1200 y 3000
// 		const tiempoScore = Math.max(
// 			0,
// 			1 - metricas.tiempoTotal / this.configuracion.tiempoMaximoEntrega
// 		);

// 		return (
// 			customerSuccessScore * PESO_CUSTOMER_SUCCESS +
// 			costoScore * PESO_COSTO +
// 			tiempoScore * PESO_TIEMPO
// 		);
// 	}

// 	public setConfiguracion(nuevaConfig: {
// 		tiempoMaximoEntrega?: number;
// 		velocidadPromedio?: number;
// 		costoBase?: number;
// 		costoPorKm?: number;
// 		maxPedidosPorGrupo?: number;
// 	}) {
// 		this.configuracion = {
// 			...this.configuracion,
// 			...nuevaConfig,
// 		};
// 	}

// 	public getConfiguracion() {
// 		return { ...this.configuracion };
// 	}
// }

// export interface OptimizadorConfig {
// 	tiempoMaximoEntrega: number;
// 	velocidadPromedio: number;
// 	costoBase: number;
// 	costoPorKm: number;
// 	maxPedidosPorGrupo: number;
// }
