import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
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
  const empresaRef = doc(firestore, "clientesAbsolute", empresaId);

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
  const clientesRef = collection(firestore, "clientesAbsolute");

  // Desafortunadamente, Firestore no permite consultar subdocumentos directamente
  // Así que necesitamos obtener todos los documentos y filtrar manualmente
  const querySnapshot = await getDocs(clientesRef);

  for (const doc of querySnapshot.docs) {
    const empresaData = doc.data() as EmpresaProps;

    if (
      empresaData.datosUsuario.telefono === telefono &&
      empresaData.datosUsuario.contraseña === contraseña
    ) {
      return { ...empresaData, id: doc.id };
    }
  }

  return null; // No se encontró ninguna coincidencia
};

// Función para obtener empresa por ID
export const obtenerEmpresaPorId = async (
  empresaId: string
): Promise<EmpresaProps | null> => {
  const firestore = getFirestore();
  const empresaRef = doc(firestore, "clientesAbsolute", empresaId);

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
  const empresaRef = doc(firestore, "clientesAbsolute", empresaId);

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
  const empresaRef = doc(firestore, "clientesAbsolute", empresaId);

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
  const clientesRef = collection(firestore, "clientesAbsolute");

  // Similar a verificarCredenciales, necesitamos buscar manualmente
  const querySnapshot = await getDocs(clientesRef);

  for (const doc of querySnapshot.docs) {
    const empresaData = doc.data() as EmpresaProps;

    if (empresaData.datosUsuario.telefono === telefono) {
      return true; // Ya existe un usuario con este teléfono
    }
  }

  return false; // El teléfono no está registrado
};
