import { getFirestore, doc, getDoc, DocumentData } from "firebase/firestore";

export const fetchUserInfoByUid = async (
	uid: string
): Promise<DocumentData | null> => {
	const firestore = getFirestore();
	const userDocRef = doc(firestore, "empleados", uid);

	try {
		const userDoc = await getDoc(userDocRef);

		if (userDoc.exists()) {
			return userDoc.data();
		} else {
			console.error("No se encontró el usuario");
			return null;
		}
	} catch (error) {
		console.error("Error al obtener el documento del usuario:", error);
		return null;
	}
};
