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
	console.log(detallePedidoLengthByDate);

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
				<p className=" text-custom-red">
					Aca necesito traer la cantidad de burgers vendidas, necesito tener
					como cargar lo que le pago a cada uno y que despues en base a eso me
					haga la cuenta segun que sale en el registro tambien
				</p>
				<p className=" text-custom-red">1.Traer los productos vendidos.</p>
			</div>
			<table className="table-auto text-red-main">
				<thead>
					<tr>
						<th className="px-4 py-2">Fecha</th>
						<th className="px-4 py-2">Cantidad de Pedidos</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(detallePedidoLengthByDate).map(
						([fecha, cantidadPedidos]) => (
							<tr key={fecha}>
								<td className="border px-4 py-2">{fecha}</td>
								<td className="border px-4 py-2">{cantidadPedidos}</td>
							</tr>
						)
					)}
				</tbody>
			</table>
		</div>
	);
};

export default RegistroEmpleado;
