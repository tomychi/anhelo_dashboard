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
	message: string;
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
	console.log("1. Iniciando escucha de Alta Demanda");
	const firestore = getFirestore();
	const docRef = doc(firestore, "constantes", "altaDemanda");

	return onSnapshot(
		docRef,
		(docSnap) => {
			console.log("2. Snapshot recibido");
			if (docSnap.exists()) {
				const data = docSnap.data();
				console.log("3. Datos del snapshot:", data);

				if (!data.isHighDemand || !data.highDemandStartTime) {
					console.log("4. Alta demanda no activa o sin tiempo de inicio");
					callback({
						delayMinutes: 0,
						highDemandStartTime: new Date(),
						isHighDemand: false,
						message: data.message || ""  // Incluir mensaje aquí
					});
					return;
				}

				callback({
					delayMinutes: data.delayMinutes,
					highDemandStartTime: data.highDemandStartTime.toDate(),
					isHighDemand: data.isHighDemand,
					message: data.message || ""  // Incluir mensaje aquí
				});
				console.log("5. Callback ejecutado con éxito");
			} else {
				console.log("6. Documento no existe");
				callback({
					delayMinutes: 0,
					highDemandStartTime: new Date(),
					isHighDemand: false,
					message: ""  // Valor por defecto
				});
			}
		},
		(error) => {
			console.error("7. Error en listener:", error);
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

export const updateAltaDemandaMessage = async (message: string): Promise<void> => {
	console.log("1. Iniciando actualización del mensaje de Alta Demanda...");
	console.log("2. Mensaje a actualizar:", message);

	const firestore = getFirestore();
	console.log("3. Firestore obtenido");

	try {
		const docRef = doc(firestore, "constantes", "altaDemanda");
		console.log("4. Referencia al documento creada:", docRef);

		console.log("5. Intentando actualizar el documento con mensaje:", message);
		await updateDoc(docRef, {
			message: message
		});
		console.log("6. Mensaje actualizado exitosamente");
	} catch (error) {
		console.error("7. Error detallado al actualizar mensaje:", error);
		console.error("8. Tipo de error:", typeof error);
		console.error("9. Stack trace:", error.stack);
		throw error;
	}
};
