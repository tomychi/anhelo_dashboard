import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Interfaces
export interface DatosGeneralesEmpresa {
  nombre: string;
  cantidadEmpleados: number;
  formaJuridica: string;
  fechaCreacion: Date;
}

export interface DatosUsuario {
  nombreUsuario: string;
  telefono: string;
  contraseña: string;
}

export interface EmpresaProps {
  id?: string;
  datosGenerales: DatosGeneralesEmpresa;
  datosUsuario: DatosUsuario;
  estado: string;
  ultimaActualizacion: Date;
}

// Función para crear una nueva empresa
export const crearEmpresa = async (
  nombreUsuario: string,
  telefono: string,
  contraseña: string,
  nombreEmpresa: string,
  cantidadEmpleados: number,
  formaJuridica: string
): Promise<string> => {
  const firestore = getFirestore();
  const empresaId = uuidv4();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);

  const fechaActual = new Date();

  const datosEmpresa: EmpresaProps = {
    id: empresaId,
    datosGenerales: {
      nombre: nombreEmpresa,
      cantidadEmpleados: cantidadEmpleados,
      formaJuridica: formaJuridica,
      fechaCreacion: fechaActual,
    },
    datosUsuario: {
      nombreUsuario: nombreUsuario,
      telefono: telefono,
      contraseña: contraseña,
    },
    estado: "activo",
    ultimaActualizacion: fechaActual,
  };

  await setDoc(empresaRef, datosEmpresa);

  return empresaId;
};

// Función para verificar las credenciales del usuario (login básico)
export const verificarCredenciales = async (
  telefono: string,
  contraseña: string
): Promise<EmpresaProps | null> => {
  const firestore = getFirestore();

  try {
    // Crear una consulta que busque específicamente por el número de teléfono
    const q = query(
      collection(firestore, "absoluteClientes"),
      where("datosUsuario.telefono", "==", telefono)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null; // No se encontró ningún usuario con ese teléfono
    }

    // Solo verificamos el primer documento que coincide (debería ser único)
    const doc = querySnapshot.docs[0];
    const empresaData = doc.data();

    // Verificar la contraseña
    // Nota: Idealmente deberías usar bcrypt u otro método de hashing seguro
    if (empresaData.datosUsuario.contraseña === contraseña) {
      return { ...empresaData, id: doc.id } as EmpresaProps;
    }

    return null; // La contraseña no coincide
  } catch (error) {
    console.error("Error al verificar credenciales:", error);
    return null;
  }
};

// Función para obtener empresa por ID
export const obtenerEmpresaPorId = async (
  empresaId: string
): Promise<EmpresaProps | null> => {
  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);

  const docSnap = await getDoc(empresaRef);

  if (docSnap.exists()) {
    return { ...(docSnap.data() as EmpresaProps), id: docSnap.id };
  } else {
    return null;
  }
};

// Función para actualizar datos de la empresa
export const actualizarEmpresa = async (
  empresaId: string,
  datosActualizados: Partial<EmpresaProps>
): Promise<void> => {
  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);

  // Asegurarse de actualizar la fecha de última actualización
  const actualizacion = {
    ...datosActualizados,
    ultimaActualizacion: new Date(),
  };

  await updateDoc(empresaRef, actualizacion);
};

// Función para actualizar el estado de la empresa
export const actualizarEstadoEmpresa = async (
  empresaId: string,
  nuevoEstado: string
): Promise<void> => {
  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);

  await updateDoc(empresaRef, {
    estado: nuevoEstado,
    ultimaActualizacion: new Date(),
  });
};

// Función para verificar si ya existe un usuario con ese teléfono
export const verificarTelefonoExistente = async (
  telefono: string
): Promise<boolean> => {
  const firestore = getFirestore();
  const clientesRef = collection(firestore, "absoluteClientes");

  try {
    // Similar a verificarCredenciales, necesitamos buscar manualmente
    const querySnapshot = await getDocs(clientesRef);

    for (const doc of querySnapshot.docs) {
      const empresaData = doc.data();

      // Verificamos que el documento tenga la estructura esperada
      if (
        empresaData &&
        empresaData.datosUsuario &&
        typeof empresaData.datosUsuario === "object" &&
        empresaData.datosUsuario.telefono
      ) {
        if (empresaData.datosUsuario.telefono === telefono) {
          return true; // Ya existe un usuario con este teléfono
        }
      }
    }

    return false; // El teléfono no está registrado
  } catch (error) {
    console.error("Error al verificar teléfono existente:", error);
    return false; // En caso de error, permitimos continuar
  }
};
