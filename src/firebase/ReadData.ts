import {
	getFirestore,
	collection,
	getDocs,
	doc,
	getDoc,
	onSnapshot,
	runTransaction,
	updateDoc,
} from "firebase/firestore";
import { PedidoProps } from "../types/types";
import { obtenerFechaActual, obtenerHoraActual } from "../helpers/dateToday";
import { ExpenseProps } from "./UploadGasto";
import { DateValueType } from "react-tailwindcss-datepicker";
import { Unsubscribe } from "redux";

export const ReadData = async () => {
	const firestore = getFirestore();

	const collections = ["burgers", "drinks", "fries", "toppings"];

	const fetchedData = await Promise.all(
		collections.map(async (collectionName) => {
			const collectionRef = collection(firestore, collectionName);
			const snapshot = await getDocs(collectionRef);

			const dataWithIds = snapshot.docs.map((doc) => ({
				id: doc.id,
				data: doc.data(),
				collectionName: collectionName,
			}));

			return dataWithIds;
		})
	);

	return fetchedData.flat();
};

export const addIngredientsToBurger = async (
	burgerId: string,
	ingredientes: Map<string, number>
): Promise<Record<string, number>> => {
	const firestore = getFirestore();
	const burgerDocRef = doc(firestore, "burgers", burgerId);
	const friesDocRef = doc(firestore, "fries", burgerId); // Usar el mismo ID para buscar en "fries"
	const drinksDocRef = doc(firestore, "drinks", burgerId); // Usar el mismo ID para buscar en "drinks"
	const toppingsDocRef = doc(firestore, "toppings", burgerId); // Usar el mismo ID para buscar en "toppings"

	try {
		// Intentar actualizar el documento en la colección "burgers"
		await updateDoc(burgerDocRef, {
			ingredients: Object.fromEntries(ingredientes.entries()),
		});

		// Devolver algún valor si es necesario
		return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
	} catch (error) {
		// Si ocurre un error, intentar actualizar el documento en la colección "fries"
		try {
			await updateDoc(friesDocRef, {
				ingredients: Object.fromEntries(ingredientes.entries()),
			});

			// Devolver algún valor si es necesario
			return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
		} catch (error) {
			// Si ocurre un error, intentar actualizar el documento en la colección "drinks"
			try {
				await updateDoc(drinksDocRef, {
					ingredients: Object.fromEntries(ingredientes.entries()),
				});

				// Devolver algún valor si es necesario
				return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
			} catch (error) {
				// Si ocurre un error, intentar actualizar el documento en la colección "toppings"
				try {
					await updateDoc(toppingsDocRef, {
						ingredients: Object.fromEntries(ingredientes.entries()),
					});

					// Devolver algún valor si es necesario
					return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
				} catch (error) {
					console.error("Error adding ingredients: ", error);
					throw new Error(
						"Failed to add ingredients to burger, fries, drinks, or toppings"
					);
				}
			}
		}
	}
};

export const ReadDataSell = async () => {
	const firestore = getFirestore();

	const collections = ["burgers", "fries", "toppings", "drinks"];

	const fetchedData = await Promise.all(
		collections.map(async (collectionName) => {
			const collectionRef = collection(firestore, collectionName);
			const snapshot = await getDocs(collectionRef);

			const dataWithIds = snapshot.docs.map((doc) => ({
				id: doc.id,
				data: doc.data(),
				collectionName: collectionName,
			}));

			return dataWithIds;
		})
	);

	return fetchedData.flat();
};

type OrdersCallback = (pedidos: PedidoProps[]) => void;
export const ReadOrdersForToday = (callback: OrdersCallback): Unsubscribe => {
	const firestore = getFirestore();
	const currentDate = new Date();
	const currentHour = currentDate.getHours();

	let targetDate;

	// Si la hora es antes de las 6 a.m., tomar el día anterior
	if (currentHour < 6) {
		const previousDay = new Date(currentDate);
		previousDay.setDate(currentDate.getDate() - 1);
		targetDate = previousDay;
	} else {
		targetDate = currentDate;
	}

	// Formatear la fecha para obtener día, mes y año en formato 'DD/MM/AAAA'
	const day = String(targetDate.getDate()).padStart(2, "0");
	const month = String(targetDate.getMonth() + 1).padStart(2, "0");
	const year = String(targetDate.getFullYear());

	// Referencia al documento del día en la colección de pedidos
	const ordersDocRef = doc(firestore, "pedidos", year, month, day);

	// Escuchar cambios en el documento del día actual
	return onSnapshot(
		ordersDocRef,
		(docSnapshot) => {
			if (docSnapshot.exists()) {
				// Obtener el arreglo de pedidos del día
				const pedidosDelDia = docSnapshot.data()?.pedidos || [];

				// Filtrar solo los pedidos que tengan la propiedad paid en true
				const pedidosPagados = pedidosDelDia.filter(
					(pedido: PedidoProps) => pedido.paid === true
				);

				// Llamar a la función de callback con los pedidos filtrados
				callback(pedidosPagados as PedidoProps[]);
			} else {
				// Si el documento no existe, no hay pedidos para el día
				callback([]); // Llamar a la función de devolución de llamada con un arreglo vacío
			}
		},
		(error) => {
			console.error("Error al obtener los pedidos para el día actual:", error);
		}
	);
};

// Función para marcar un pedido como elaborado en Firestore
export const marcarPedidoComoElaborado = async (
	pedidoId: string,
	tiempo: string
) => {
	const todayDateString = obtenerFechaActual();
	const [dia, mes, anio] = todayDateString.split("/");

	try {
		const firestore = getFirestore();
		const pedidoDocRef = doc(firestore, "pedidos", anio, mes, dia);

		await runTransaction(firestore, async (transaction) => {
			const pedidoDocSnapshot = await transaction.get(pedidoDocRef);

			if (!pedidoDocSnapshot.exists()) {
				console.error("No se encontró el documento del día en Firestore");
				return;
			}

			const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];
			const index = pedidosDelDia.findIndex(
				(pedido: PedidoProps) => pedido.id === pedidoId
			);

			if (index !== -1) {
				pedidosDelDia[index].elaborado = true;
				pedidosDelDia[index].tiempoElaborado = tiempo;
				transaction.set(pedidoDocRef, { pedidos: pedidosDelDia });
				console.log("Pedido marcado como elaborado en Firestore");
			} else {
				console.error(
					"El pedido no fue encontrado en el arreglo de pedidos del día"
				);
			}
		});
	} catch (error) {
		console.error("Error al marcar pedido como elaborado en Firestore:", error);
	}
};

export const marcarPedidoComoEntregado = async (
	pedidoId: string,
	fecha: string
) => {
	const [dia, mes, anio] = fecha.split("/");
	const tiempo = obtenerHoraActual();
	try {
		const firestore = getFirestore();
		const pedidoDocRef = doc(firestore, "pedidos", anio, mes, dia);

		await runTransaction(firestore, async (transaction) => {
			const pedidoDocSnapshot = await transaction.get(pedidoDocRef);

			if (!pedidoDocSnapshot.exists()) {
				console.error("No se encontró el documento del día en Firestore");
				return;
			}

			const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];
			const index = pedidosDelDia.findIndex(
				(pedido: PedidoProps) => pedido.id === pedidoId
			);

			if (index !== -1) {
				pedidosDelDia[index].tiempoEntregado = tiempo;
				pedidosDelDia[index].entregado = true;
				transaction.set(pedidoDocRef, { pedidos: pedidosDelDia });
				console.log("Pedido marcado como entregado en Firestore");
			} else {
				console.error(
					"El pedido no fue encontrado en el arreglo de pedidos del día"
				);
			}
		});
	} catch (error) {
		console.error("Error al marcar pedido como entregado en Firestore:", error);
	}
};

export const marcarPedidoComoEmbalado = async (
	pedidoId: string,
	fecha: string
) => {
	const [dia, mes, anio] = fecha.split("/");
	const tiempo = obtenerHoraActual();
	try {
		const firestore = getFirestore();
		const pedidoDocRef = doc(firestore, "pedidos", anio, mes, dia);

		await runTransaction(firestore, async (transaction) => {
			const pedidoDocSnapshot = await transaction.get(pedidoDocRef);

			if (!pedidoDocSnapshot.exists()) {
				console.error("No se encontró el documento del día en Firestore");
				return;
			}

			const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];
			const index = pedidosDelDia.findIndex(
				(pedido: PedidoProps) => pedido.id === pedidoId
			);

			if (index !== -1) {
				pedidosDelDia[index].tiempoEmbalado = tiempo;
				transaction.set(pedidoDocRef, { pedidos: pedidosDelDia });
				console.log("Pedido marcado como entregado en Firestore");
			} else {
				console.error(
					"El pedido no fue encontrado en el arreglo de pedidos del día"
				);
			}
		});
	} catch (error) {
		console.error("Error al marcar pedido como entregado en Firestore:", error);
	}
};

// Función para eliminar un pedido de la base de datos en Firestore
export const eliminarDocumento = async (
	dbName: string,
	documentoId: string,
	fecha: string
) => {
	try {
		// Obtener el año, mes y día de la fecha proporcionada
		const [dia, mes, anio] = fecha.split("/");

		// Obtener referencia al documento del día dentro de la colección en Firestore
		const docRef = doc(getFirestore(), dbName, anio, mes, dia);

		runTransaction(getFirestore(), async (transaction) => {
			const docSnapshot = await transaction.get(docRef);

			if (!docSnapshot.exists()) {
				console.error(
					`No se encontró el documento del día en Firestore para ${dbName}`
				);
				return;
			}

			// Si el documento existe, obtener el arreglo de pedidos o gastos
			const data = docSnapshot.data()?.[dbName] || [];

			// Filtrar el arreglo para excluir el documento que se va a eliminar
			const dataActualizado = data.filter(
				(item: ExpenseProps | PedidoProps) => item.id !== documentoId
			);

			// Actualizar el documento del día con el arreglo actualizado
			transaction.set(docRef, {
				[dbName]: dataActualizado,
			});
		})
			.then(() => {
				console.log(`${dbName} eliminado de Firestore`);
			})
			.catch((error) => {
				console.error(`Error al eliminar ${dbName} de Firestore:`, error);
			});
	} catch (error) {
		console.error(`Error al eliminar ${dbName} de Firestore:`, error);
	}
};

export const ReadDataForDateRange = <T>(
	dbName: string,
	valueDate: DateValueType
): Promise<T[]> => {
	return new Promise((resolve, reject) => {
		let requestCounter = 0; // Inicializar contador de solicitudes

		try {
			if (!valueDate || !valueDate.startDate || !valueDate.endDate) {
				throw new Error("Fecha de inicio o fin no especificada.");
			}
			const { startDate, endDate } = valueDate;
			const firestore = getFirestore();

			const allData: { [key: string]: T[] } = {};

			const getDataForDate = async (date: Date) => {
				requestCounter++;

				const year = date.getFullYear().toString();
				const month = (date.getMonth() + 1).toString().padStart(2, "0");
				const day = date.getDate().toString().padStart(2, "0");

				const docRef = doc(firestore, dbName, year, month, day);

				try {
					const docSnapshot = await getDoc(docRef);
					if (docSnapshot.exists()) {
						const data = docSnapshot.data()?.[dbName] || [];
						allData[`${year}-${month}-${day}`] = data;
					} else {
						allData[`${year}-${month}-${day}`] = [];
					}
				} catch (error) {
					throw new Error(
						`Error al obtener los datos para la fecha ${year}-${month}-${day}: ${error}`
					);
				}
			};

			const datesInRange = [];
			const currentDate = new Date(`${startDate}T00:00:00`);
			const end = new Date(`${endDate}T00:00:00`);

			while (currentDate <= end) {
				datesInRange.push(new Date(currentDate));
				currentDate.setDate(currentDate.getDate() + 1);
			}

			const getDataPromises = datesInRange.map((date) => getDataForDate(date));

			Promise.all(getDataPromises)
				.then(() => {
					const mergedData = Object.values(allData).reduce(
						(merged, data) => [...merged, ...data],
						[]
					);
					console.log(
						"Número total de solicitudes a la base de datos:",
						requestCounter
					); // Imprimir el número total de solicitudes

					resolve(mergedData);
				})
				.catch((error) => {
					reject(error);
				});
		} catch (error) {
			reject(error);
		}
	});
};
export const readTelefonosFromFirebase = async () => {
	const firestore = getFirestore();
	const collectionRef = collection(firestore, "telefonos");

	try {
		const querySnapshot = await getDocs(collectionRef);
		const telefonos = querySnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				fecha: data.fecha || "", // Asegurarse de que la fecha esté presente
				telefono: data.telefono || "", // Asegurarse de que el teléfono esté presente
			};
		});
		return telefonos;
	} catch (error) {
		console.error(
			"Error al obtener los números de teléfono desde Firebase:",
			error
		);
		throw error;
	}
};

export const ReadGastosSinceTwoMonthsAgo = async () => {
	const firestore = getFirestore();

	// Fecha actual
	const currentDate = new Date();

	// Fecha de dos meses atrás
	const twoMonthsAgoDate = new Date();
	twoMonthsAgoDate.setMonth(currentDate.getMonth() - 2);

	try {
		const gastosData: any[] = []; // Acumulará todos los gastos

		// Función auxiliar para formatear las fechas en el formato correcto
		const formatDate = (date: Date) => {
			const year = date.getFullYear().toString();
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			return { year, month };
		};

		// Recorrer desde el mes de hace dos meses hasta el mes actual
		let tempDate = new Date(twoMonthsAgoDate);
		while (tempDate <= currentDate) {
			const { year, month } = formatDate(tempDate);

			// Referencia al documento del año
			const yearDocRef = doc(firestore, "gastos", year);
			const monthCollectionRef = collection(yearDocRef, month);

			// Consultar los días dentro del mes
			const daysSnapshot = await getDocs(monthCollectionRef);

			if (!daysSnapshot.empty) {
				// Iterar sobre los días del mes
				for (const dayDoc of daysSnapshot.docs) {
					const dayDocRef = doc(firestore, "gastos", year, month, dayDoc.id);
					const daySnapshot = await getDoc(dayDocRef);

					if (daySnapshot.exists()) {
						const dayData = daySnapshot.data();
						const gastosArray = dayData.gastos || [];
						gastosData.push(...gastosArray); // Acumular todos los gastos del día
					}
				}
			}

			// Avanzar al siguiente mes
			tempDate.setMonth(tempDate.getMonth() + 1);
		}

		return gastosData;
	} catch (error) {
		console.error("Error al leer la colección de gastos:", error);
		throw error;
	}
};

export const updateBurgersRatings = async (orders: PedidoProps[]) => {
	try {
		const firestore = getFirestore();
		const allProducts = await ReadData();
		const burgers = allProducts.filter(
			(product) => product.collectionName === "burgers"
		);

		// Obtener calificaciones de los pedidos
		const productRatings: { [key: string]: number[] } = {};

		orders.forEach((order) => {
			if (order.rating && typeof order.rating === "object") {
				order.detallePedido.forEach((item) => {
					const productName = item.burger;
					const rating = order.rating[productName];

					if (typeof rating === "number") {
						if (!productRatings[productName]) {
							productRatings[productName] = [];
						}
						productRatings[productName].push(rating);
					}
				});
			}
		});

		// Actualizar el rating de cada burger
		const updatePromises = burgers.map(async (burger) => {
			const burgerName = burger.data.name;
			const ratings = productRatings[burgerName] || [];
			const averageRating =
				ratings.length > 0
					? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
					: 0;

			// Actualizar el documento en Firebase
			const burgerRef = doc(firestore, "burgers", burger.id);
			return updateDoc(burgerRef, {
				rating: Number(averageRating.toFixed(1)),
			});
		});

		await Promise.all(updatePromises);
		console.log("Ratings actualizados exitosamente");
		return true;
	} catch (error) {
		console.error("Error al actualizar los ratings:", error);
		throw error;
	}
};
