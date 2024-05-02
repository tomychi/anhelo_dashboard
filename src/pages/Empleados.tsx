import React, { useEffect, useState } from "react";
import {
	EmpleadosProps,
	marcarEntrada,
	marcarSalida,
	obtenerRegistroActual,
	readEmpleados,
} from "../firebase/registroEmpleados";
import { RootState } from "../redux/configureStore";
import { useSelector } from "react-redux";

export interface RegistroProps {
	horaEntrada: string;
	nombreEmpleado: string;
	horaSalida: string;
	marcado: boolean;
}

const handleMarcarEntrada = async (
	nombreEmpleado: string,
	setEmpleados: React.Dispatch<React.SetStateAction<EmpleadosProps[]>>
) => {
	await marcarEntrada(nombreEmpleado);
	setEmpleados((prevEmpleados) => [...prevEmpleados]);
};

const handleMarcarSalida = async (
	nombreEmpleado: string,
	setEmpleados: React.Dispatch<React.SetStateAction<EmpleadosProps[]>>
) => {
	await marcarSalida(nombreEmpleado);
	setEmpleados((prevEmpleados) => [...prevEmpleados]);
};

const RegistroEmpleado = () => {
	const [registro, setRegistro] = useState<RegistroProps[]>([]);
	const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);

	useEffect(() => {
		const getEmpleados = async () => {
			const cade = await readEmpleados();
			setEmpleados(cade);
		};
		getEmpleados();
	}, []);

	useEffect(() => {
		const cargarRegistro = async () => {
			try {
				const datosRegistro = await obtenerRegistroActual();
				setRegistro(datosRegistro);
			} catch (error) {
				console.error("Error al cargar el registro:", error);
			}
		};

		cargarRegistro();
	}, [empleados]);

	const { orders } = useSelector((state: RootState) => state.data);

	// Función para agrupar los pedidos por fecha
	const groupOrdersByDate = (orders) => {
		return orders.reduce((groupedOrders, order) => {
			const date = order.fecha;
			if (!groupedOrders[date]) {
				groupedOrders[date] = [];
			}
			groupedOrders[date].push(order);
			return groupedOrders;
		}, {});
	};

	// Llama a la función para obtener los pedidos agrupados por fecha
	const ordersByDate = groupOrdersByDate(orders);

	// Muestra los pedidos agrupados por fecha
	// console.log(ordersByDate);

	// Función para sumar el largo de detallePedido teniendo en cuenta la cantidad
	const sumDetallePedidoLength = (ordersByDate) => {
		const result = {};

		for (const fecha in ordersByDate) {
			if (Object.hasOwnProperty.call(ordersByDate, fecha)) {
				let totalDetallePedidoLength = 0;
				const orders = ordersByDate[fecha];

				for (const order of orders) {
					for (const detalle of order.detallePedido) {
						totalDetallePedidoLength +=
							detalle.quantity > 1 ? detalle.quantity : 1;
					}
				}

				result[fecha] = totalDetallePedidoLength;
			}
		}

		return result;
	};

	// Llama a la función para obtener la suma del largo de detallePedido por fecha
	const detallePedidoLengthByDate = sumDetallePedidoLength(ordersByDate);

	// Muestra el resultado
	//Aca tengo las burgers por dia
	// console.log(detallePedidoLengthByDate);

	function calcularSalario(cantidadProductosVendidos, cantidadHoras) {
		// Parsear la cantidad de horas en formato de cadena 'HH:MM' a horas y minutos
		const [horas, minutos] = cantidadHoras.split(":").map(Number);

		// Convertir las horas y minutos a minutos totales
		const minutosTotales = horas * 60 + minutos;

		let salarioPorHora;

		if (cantidadProductosVendidos < 70) {
			salarioPorHora = 3000;
		} else if (
			cantidadProductosVendidos >= 70 &&
			cantidadProductosVendidos <= 99
		) {
			salarioPorHora = 4000;
		} else if (
			cantidadProductosVendidos >= 100 &&
			cantidadProductosVendidos <= 129
		) {
			salarioPorHora = 5000;
		} else if (
			cantidadProductosVendidos >= 130 &&
			cantidadProductosVendidos <= 159
		) {
			salarioPorHora = 6000;
		} else {
			salarioPorHora = 7000;
		}

		// Calcular el salario total
		const salarioTotal = salarioPorHora * (minutosTotales / 60);

		return salarioTotal;
	}

	// Ejemplo de uso:
	const cantidadProductosVendidos = 100;
	const cantidadHorasTrabajadas = "08:17"; // Horas: 8, Minutos: 17
	const salario = calcularSalario(
		cantidadProductosVendidos,
		cantidadHorasTrabajadas
	);
	console.log("El salario a pagar es: $" + salario.toFixed(2));

	return (
		<div className="p-4 font-antonio flex flex-row gap-4 font-black">
			<div className="w-1/4">
				<p className="text-4xl text-custom-red">REGISTRO DE HORARIOS</p>
				{/* Filtrar empleados por categoría y mapear sobre cada grupo */}
				{["cocina", "mostrador", "cadete"].map((categoria, categoriaIndex) => (
					<div key={categoriaIndex} className="text-custom-red">
						<p className="text-2xl mt-4">{categoria.toUpperCase()}</p>
						{empleados
							.filter((empleado) => empleado.category === categoria)
							.map((empleado, index) => {
								// Verifica si el nombre del empleado está presente en el registro del día actual
								const estaEnRegistro = registro.some(
									(registroEmpleado) =>
										registroEmpleado.nombreEmpleado === empleado.name
								);

								// Verifica si el empleado está marcado en el registro
								const empleadoMarcado = registro.find(
									(registroEmpleado) =>
										registroEmpleado.nombreEmpleado === empleado.name &&
										registroEmpleado.marcado
								);

								// Determina el color del fondo del botón basado en la presencia del empleado en el registro y su estado de marcado
								const colorFondo = empleadoMarcado
									? "bg-green-600"
									: "bg-custom-red";

								return (
									<button
										key={index}
										className={`text-black mt-2 p-4 w-full flex flex-col ${colorFondo} font-black uppercase text-4x1 outline-none`}
										onClick={() =>
											estaEnRegistro
												? handleMarcarSalida(empleado.name, setEmpleados)
												: handleMarcarEntrada(empleado.name, setEmpleados)
										}
									>
										{empleado.name}
									</button>
								);
							})}
					</div>
				))}
			</div>
			{/* SUELDOS */}
			<div className=" w-3/4">
				<p className="text-4xl text-custom-red">SUELDOS</p>

				<table className="h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
					<thead className="text-xs uppercase text-black border border-red-main bg-custom-red ">
						<tr>
							<th scope="col" className="px-6 py-3">
								FECHA
							</th>
							<th scope="col" className="px-6 py-3">
								CANTIDAD DE PRODUCTOS
							</th>
							<th scope="col" className="px-6 py-3">
								CANTIDAD DE VIAJES
							</th>
						</tr>
					</thead>
					<tbody>
						{Object.entries(detallePedidoLengthByDate).map(
							([fecha, cantidadPedidos]) => (
								<tr
									key={fecha}
									className="bg-black text-custom-red uppercase font-black border border-red-main"
								>
									<th
										scope="row"
										className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
									>
										{fecha}
									</th>
									<td className="px-6 py-4">{cantidadPedidos} = $</td>
									<td className="px-6 py-4">{cantidadPedidos} = $</td>
								</tr>
							)
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default RegistroEmpleado;
