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

		console.log(
			`Se han generado y almacenado ${cantidad} códigos correctamente.`
		);
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

		console.log(`Documento creado exitosamente con el título: ${titulo}`);
	} catch (error) {
		console.error("Error al crear el documento:", error);
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

		console.log(
			`Cantidad de vouchers usados actualizada a ${cantidadUsados} para el título: ${titulo}`
		);
	} catch (error) {
		console.error("Error al actualizar la cantidad de vouchers usados:", error);
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
			console.log("No se encontró el documento para la campaña:", titulo);
			return [];
		}
	} catch (error) {
		console.error("Error al obtener los códigos de la campaña:", error);
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

		console.log(`Códigos subidos correctamente bajo el título: ${titulo}`);
	} catch (error) {
		console.error("Error al subir los códigos:", error);
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
		console.error("Error al obtener los códigos:", error);
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

		console.log("Códigos movidos y eliminados correctamente");
	} catch (error) {
		console.error("Error al mover códigos:", error);
	}
};
