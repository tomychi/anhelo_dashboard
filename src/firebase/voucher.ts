import {
	addDoc,
	arrayUnion,
	collection,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	runTransaction,
	setDoc,
	updateDoc,
	writeBatch,
} from "firebase/firestore";

export interface Codigo {
	codigo: string;
	estado: string;
	num: number;
}

interface CostItem {
	title: string;
	value: number;
}

interface Pedido {
	fecha: string;
	total: number;
	subTotal: number;
	couponCodes?: string[];
	// ... otros campos que necesites
}

export const obtenerPedidosDesdeCampana = async (
	fechaCampana: string,
	titulo: string
): Promise<Pedido[]> => {
	const firestore = getFirestore();
	const pedidosEncontrados: Pedido[] = [];
	const cuponesEncontrados = new Set<string>();

	try {
		// 1. Primero obtenemos los datos de la campaña
		const voucherRef = doc(firestore, "vouchers", titulo);
		const voucherDoc = await getDoc(voucherRef);

		if (!voucherDoc.exists()) {
			// console.log("No se encontró la campaña:", titulo);
			return [];
		}

		const voucherData = voucherDoc.data();
		const codigosCampana = voucherData.codigos
			.filter((c) => c.estado === "usado")
			.map((c) => c.codigo);

		// console.log(`Códigos marcados como usados:`, codigosCampana);
		// console.log(
		// 	`Total de códigos usados en la campaña ${titulo}:`,
		// 	codigosCampana.length
		// );

		// 2. Convertimos la fecha de inicio
		let fechaInicio: Date;
		if (fechaCampana.includes("-")) {
			const [ano, mes, dia] = fechaCampana.split("-");
			fechaInicio = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
		} else {
			const [dia, mes, ano] = fechaCampana.split("/");
			fechaInicio = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
		}
		// console.log("Buscando pedidos desde:", fechaInicio);

		// 3. Configuramos el rango de fechas a buscar
		const fechaActual = new Date();
		const anoActual = fechaActual.getFullYear();
		const mesActual = fechaActual.getMonth() + 1;

		// 4. Iteramos por cada mes desde la fecha de inicio
		for (let ano = fechaInicio.getFullYear(); ano <= anoActual; ano++) {
			const mesInicial =
				ano === fechaInicio.getFullYear() ? fechaInicio.getMonth() + 1 : 1;
			const mesFinal = ano === anoActual ? mesActual : 12;

			for (let mes = mesInicial; mes <= mesFinal; mes++) {
				const mesStr = mes.toString().padStart(2, "0");
				const collectionPath = `pedidos/${ano}/${mesStr}`;

				try {
					// console.log(`Buscando en ${collectionPath}`);
					const pedidosRef = collection(firestore, collectionPath);
					const querySnapshot = await getDocs(pedidosRef);

					for (const doc of querySnapshot.docs) {
						const docData = doc.data();

						// Verificar si el documento tiene la estructura correcta
						if (!docData.pedidos || !Array.isArray(docData.pedidos)) {
							// console.log(`Documento ${doc.id} no tiene pedidos válidos`);
							continue;
						}

						// 5. Revisamos cada pedido del mes
						for (const pedido of docData.pedidos) {
							if (!pedido.fecha || !pedido.couponCodes) continue;

							// 6. Verificamos si el pedido usó algún código de la campaña
							const codigosUsados = pedido.couponCodes.filter((cupon) =>
								codigosCampana.includes(cupon)
							);

							if (codigosUsados.length > 0) {
								codigosUsados.forEach((codigo) =>
									cuponesEncontrados.add(codigo)
								);
								// console.log("Pedido encontrado:", {
								// 	fecha: pedido.fecha,
								// 	cupones: pedido.couponCodes,
								// 	total: pedido.total,
								// 	subTotal: pedido.subTotal,
								// });
								pedidosEncontrados.push(pedido);
							}
						}
					}
				} catch (error) {
					console.error("Error procesando mes:", mesStr, error);
				}
			}
		}

		// console.log(
		// 	`Códigos que NO se encontraron en ningún pedido:`,
		// 	codigosCampana.filter((codigo) => !cuponesEncontrados.has(codigo))
		// );

		// console.log(
		// 	`Total códigos encontrados en pedidos: ${cuponesEncontrados.size}`
		// );
		// console.log(`Total códigos marcados como usados: ${codigosCampana.length}`);
		// console.log(
		// 	`Total de pedidos encontrados que usaron cupones de ${titulo}:`,
		// 	pedidosEncontrados.length
		// );
		return pedidosEncontrados;
	} catch (error) {
		console.error("Error al obtener los pedidos:", error);
		throw error;
	}
};

// Función auxiliar para calcular estadísticas de los pedidos
export const calcularEstadisticasPedidos = (pedidos: Pedido[]) => {
	// Suma total de cupones usados entre todos los pedidos
	const totalCupones = pedidos.reduce(
		(sum, pedido) => sum + (pedido.couponCodes?.length || 0),
		0
	);

	return {
		totalPedidos: pedidos.length,
		totalCupones: totalCupones,
		promedioCuponesPorPedido: totalCupones / pedidos.length,
		montoTotal: pedidos.reduce((sum, pedido) => sum + pedido.total, 0),
		montoSinDescuento: pedidos.reduce(
			(sum, pedido) => sum + pedido.subTotal,
			0
		),
		descuentoTotal: pedidos.reduce(
			(sum, pedido) => sum + (pedido.subTotal - pedido.total),
			0
		),
		promedioDescuento:
			pedidos.length > 0
				? pedidos.reduce(
						(sum, pedido) => sum + (pedido.subTotal - pedido.total),
						0
				  ) / pedidos.length
				: 0,
	};
};

export const actualizarCostosCampana = async (
	titulo: string,
	costo: CostItem,
	isAdd: boolean = false
) => {
	try {
		const firestore = getFirestore();
		const voucherRef = doc(firestore, "vouchers", titulo);

		if (isAdd) {
			await updateDoc(voucherRef, {
				costos: arrayUnion(costo),
			});
		} else {
			await updateDoc(voucherRef, {
				costos: costo,
			});
		}
	} catch (error) {
		console.error("Error actualizando costos:", error);
		throw error;
	}
};

export const obtenerCostosCampana = async (
	titulo: string
): Promise<CostItem[]> => {
	try {
		const firestore = getFirestore();
		const voucherRef = doc(firestore, "vouchers", titulo);
		const voucherDoc = await getDoc(voucherRef);

		if (voucherDoc.exists()) {
			const data = voucherDoc.data();
			return data.costos || [];
		}
		return [];
	} catch (error) {
		console.error("Error al cargar los costos:", error);
		throw error;
	}
};

export const generarCodigos = async (cantidad: number): Promise<Codigo[]> => {
	const codigosGenerados: Codigo[] = [];

	try {
		for (let i = 0; i < cantidad; i++) {
			const codigo = Math.random().toString(36).substring(2, 7).toUpperCase();
			const nuevoCodigo: Codigo = {
				codigo,
				estado: "disponible",
				num: i + 1,
			};
			codigosGenerados.push(nuevoCodigo);
		}

		// console.log(
		// 	`Se han generado y almacenado ${cantidad} códigos correctamente.`
		// );
		return codigosGenerados;
	} catch (error) {
		console.error("Error al generar y almacenar los códigos:", error);
		throw error;
	}
};

export const crearVoucher = async (
	titulo: string,
	fecha: string,
	cant: number
): Promise<void> => {
	const firestore = getFirestore();
	const voucherDocRef = doc(firestore, "vouchers", titulo);

	try {
		const codigos = await generarCodigos(cant);

		await setDoc(voucherDocRef, {
			titulo,
			fecha,
			codigos,
			creados: cant,
			usados: 0,
		});

		// console.log(`Documento creado exitosamente con el título: ${titulo}`);
	} catch (error) {
		// console.error("Error al crear el documento:", error);
		throw error;
	}
};

export interface VoucherTituloConFecha {
	titulo: string;
	fecha: string;
	canjeados: number;
	usados: number;
	creados: number;
	codigos: {
		codigo: string;
		estado: string;
		num: number;
	}[];
}

export const obtenerTitulosVouchers = async (): Promise<
	VoucherTituloConFecha[]
> => {
	const firestore = getFirestore();
	const vouchersCollectionRef = collection(firestore, "vouchers");

	try {
		const querySnapshot = await getDocs(vouchersCollectionRef);
		const titulosConFecha: VoucherTituloConFecha[] = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			titulosConFecha.push({
				titulo: doc.id,
				fecha: data.fecha || "Fecha no disponible",
				canjeados: data.canjeados,
				usados: data.usados,
				creados: data.creados,
				codigos: data.codigos,
			});
		});

		return titulosConFecha;
	} catch (error) {
		console.error("Error al obtener los títulos de vouchers:", error);
		throw error;
	}
};

export const canjearVoucher = async (codigo: string): Promise<boolean> => {
	const firestore = getFirestore();
	const vouchersCollectionRef = collection(firestore, "vouchers");

	try {
		const success = await runTransaction(firestore, async (transaction) => {
			const querySnapshot = await getDocs(vouchersCollectionRef);
			let voucherEncontrado = false;

			for (const docSnapshot of querySnapshot.docs) {
				const data = docSnapshot.data();
				const codigos = data.codigos || [];

				const codigoIndex = codigos.findIndex(
					(c: Codigo) => c.codigo === codigo
				);

				if (codigoIndex !== -1) {
					if (codigos[codigoIndex].estado === "usado") {
						console.error("El voucher ya ha sido canjeado");
						return false;
					}

					codigos[codigoIndex].estado = "usado";

					const voucherDocRef = doc(firestore, "vouchers", docSnapshot.id);
					transaction.update(voucherDocRef, { codigos });

					voucherEncontrado = true;
					break;
				}
			}

			if (!voucherEncontrado) {
				console.error("No se encontró el voucher con el código proporcionado");
				return false;
			}

			return true;
		});

		return success;
	} catch (error) {
		console.error("Error al canjear el voucher:", error);
		throw error;
	}
};

export const actualizarVouchersUsados = async (
	titulo: string,
	cantidadUsados: number
): Promise<void> => {
	const firestore = getFirestore();
	const voucherDocRef = doc(firestore, "vouchers", titulo);

	try {
		await updateDoc(voucherDocRef, {
			usados: cantidadUsados,
		});

		// console.log(
		// 	`Cantidad de vouchers usados actualizada a ${cantidadUsados} para el título: ${titulo}`
		// );
	} catch (error) {
		// console.error("Error al actualizar la cantidad de vouchers usados:", error);
		throw error;
	}
};

export const obtenerCodigosCampana = async (
	titulo: string
): Promise<Array<{ codigo: string; num: number }>> => {
	const firestore = getFirestore();
	const voucherDocRef = doc(firestore, "vouchers", titulo);

	try {
		const voucherDoc = await getDoc(voucherDocRef);
		if (voucherDoc.exists()) {
			const data = voucherDoc.data();
			return data.codigos || [];
		} else {
			// console.log("No se encontró el documento para la campaña:", titulo);
			return [];
		}
	} catch (error) {
		// console.error("Error al obtener los códigos de la campaña:", error);
		throw error;
	}
};

export const subirCodigosExistentes = async (
	codigos: string[]
): Promise<void> => {
	const firestore = getFirestore();
	const titulo = "baco";
	const voucherDocRef = doc(firestore, "vouchers", titulo);

	const usados = ["EA2E9", "HO77E", "69198", "19XUO"];

	try {
		const batch = codigos.map((codigo, index) => ({
			codigo,
			estado: usados.includes(codigo) ? "usado" : "disponible",
			num: index + 1,
		}));

		const voucherDoc = await getDoc(voucherDocRef);
		if (!voucherDoc.exists()) {
			await setDoc(voucherDocRef, {
				codigos: batch,
				fecha: "24/08/2024",
				canjeados: 0,
				usados: 0,
				creados: codigos.length,
			});
		} else {
			await updateDoc(voucherDocRef, {
				codigos: arrayUnion(...batch),
				creados: (voucherDoc.data().creados || 0) + codigos.length,
			});
		}

		// console.log(`Códigos subidos correctamente bajo el título: ${titulo}`);
	} catch (error) {
		// console.error("Error al subir los códigos:", error);
		throw error;
	}
};

export const obtenerCodigosOrdenados = async (): Promise<Codigo[]> => {
	const firestore = getFirestore();
	const codigosCollectionRef = collection(firestore, "codigos");

	try {
		const querySnapshot = await getDocs(codigosCollectionRef);
		const codigos: Codigo[] = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			if (data.codigo && data.num) {
				codigos.push({
					codigo: data.codigo,
					num: data.num,
					estado: data.estado,
				} as Codigo);
			}
		});

		codigos.sort((a, b) => a.num - b.num);

		return codigos;
	} catch (error) {
		// console.error("Error al obtener los códigos:", error);
		throw error;
	}
};

export const moverCodigosARango = async (
	titulo: string,
	codigosSeleccionados: Codigo[]
) => {
	const db = getFirestore();

	try {
		const voucherRef = doc(db, "vouchers", titulo);
		const batch = writeBatch(db);
		const voucherDocSnapshot = await getDoc(voucherRef);
		let existingCodigos: Codigo[] = [];

		if (voucherDocSnapshot.exists()) {
			const data = voucherDocSnapshot.data();
			existingCodigos = data?.codigos || [];
		}

		batch.update(voucherRef, {
			codigos: [...existingCodigos, ...codigosSeleccionados],
		});

		for (const codigo of codigosSeleccionados) {
			const codigosSnapshot = await getDocs(collection(db, "codigos"));
			codigosSnapshot.forEach((doc) => {
				const data = doc.data();
				if (data.codigo === codigo.codigo) {
					batch.delete(doc.ref);
				}
			});
		}

		await batch.commit();

		// console.log("Códigos movidos y eliminados correctamente");
	} catch (error) {
		console.error("Error al mover códigos:", error);
	}
};
