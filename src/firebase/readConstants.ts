import {
	getFirestore,
	doc,
	getDoc,
	onSnapshot,
	updateDoc,
	deleteField,
} from "firebase/firestore";
import { Unsubscribe } from "firebase/auth";

// Interfaces para tipar los datos
export interface AltaDemandaProps {
	delayMinutes: number;
	highDemandStartTime: Date;
	isHighDemand: boolean;
}

// Función para leer una sola vez
export const readAltaDemanda = async (): Promise<AltaDemandaProps | null> => {
	console.log("Iniciando lectura de Alta Demanda...");
	const firestore = getFirestore();
	try {
		const docRef = doc(firestore, "constantes", "altaDemanda");
		console.log("Referencia al documento creada");

		const docSnap = await getDoc(docRef);
		console.log("Snapshot del documento obtenido");

		if (docSnap.exists()) {
			const data = docSnap.data();
			console.log("Datos encontrados:", data);
			return {
				delayMinutes: data.delayMinutes,
				highDemandStartTime: data.highDemandStartTime.toDate(),
				isHighDemand: data.isHighDemand,
			};
		} else {
			console.log("No se encontró el documento de Alta Demanda");
			return null;
		}
	} catch (error) {
		console.error("Error al leer Alta Demanda:", error);
		throw error;
	}
};

// Función para escuchar cambios en tiempo real
// En readConstants.ts, modifica la función listenToAltaDemanda
export const listenToAltaDemanda = (
	callback: (altaDemanda: AltaDemandaProps) => void
): Unsubscribe => {
	console.log("Iniciando escucha de cambios en Alta Demanda...");
	const firestore = getFirestore();
	const docRef = doc(firestore, "constantes", "altaDemanda");

	return onSnapshot(
		docRef,
		(docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				// console.log("Cambios detectados en Alta Demanda:", data);

				// Si no hay alta demanda activa o falta highDemandStartTime
				if (!data.isHighDemand || !data.highDemandStartTime) {
					callback({
						delayMinutes: 0,
						highDemandStartTime: new Date(), // fecha actual como fallback
						isHighDemand: false,
					});
					return;
				}

				callback({
					delayMinutes: data.delayMinutes,
					highDemandStartTime: data.highDemandStartTime.toDate(),
					isHighDemand: data.isHighDemand,
				});
			} else {
				console.log("El documento de Alta Demanda no existe");
				callback({
					delayMinutes: 0,
					highDemandStartTime: new Date(),
					isHighDemand: false,
				});
			}
		},
		(error) => {
			console.error("Error en la escucha de Alta Demanda:", error);
		}
	);
};

// Agregar esta nueva función para actualizar alta demanda
export const updateAltaDemanda = async (
	delayMinutes: number
): Promise<void> => {
	console.log("Iniciando actualización de Alta Demanda...");
	const firestore = getFirestore();

	try {
		const docRef = doc(firestore, "constantes", "altaDemanda");

		await updateDoc(docRef, {
			delayMinutes: delayMinutes,
			highDemandStartTime: new Date(),
			isHighDemand: true,
		});

		console.log("Alta Demanda actualizada exitosamente");
	} catch (error) {
		console.error("Error al actualizar Alta Demanda:", error);
		throw error;
	}
};

// Función para desactivar alta demanda
export const deactivateHighDemand = async (): Promise<void> => {
	console.log("Desactivando Alta Demanda...");
	const firestore = getFirestore();

	try {
		const docRef = doc(firestore, "constantes", "altaDemanda");

		await updateDoc(docRef, {
			delayMinutes: 0,
			isHighDemand: false,
			highDemandStartTime: deleteField(), // Esto eliminará el campo
		});

		console.log("Alta Demanda desactivada exitosamente");
	} catch (error) {
		console.error("Error al desactivar Alta Demanda:", error);
		throw error;
	}
};
