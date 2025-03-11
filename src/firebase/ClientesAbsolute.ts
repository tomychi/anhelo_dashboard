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
  rolUsuario: string; // Add the role field
}

export interface EmpresaProps {
  id?: string;
  datosGenerales: DatosGeneralesEmpresa;
  datosUsuario: DatosUsuario;
  estado: string;
  ultimaActualizacion: Date;
}

export interface EmpleadoProps {
  id: string;
  empresaId: string;
  datos: {
    nombre: string;
    rol: string;
    estado: string;
    permisos: string[];
    // otros campos como fechaContratacion, salario, etc.
  };
  iniciarSesion: {
    telefono: number;
    contraseña: string;
  };
}

// Función para crear una nueva empresa
export const crearEmpresa = async (
  nombreUsuario: string,
  telefono: string,
  contraseña: string,
  nombreEmpresa: string,
  cantidadEmpleados: number,
  formaJuridica: string,
  rolUsuario: string // Add the role parameter
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
      rolUsuario: rolUsuario, // Store the role in the user data
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

// Función para verificar credenciales de empleado
export const verificarCredencialesEmpleado = async (
  telefono: string,
  contraseña: string
): Promise<EmpleadoProps | null> => {
  const firestore = getFirestore();

  try {
    // Primero necesitamos encontrar la empresa correspondiente
    const empresasRef = collection(firestore, "absoluteClientes");
    const empresasSnapshot = await getDocs(empresasRef);

    // Iterar por cada empresa
    for (const empresaDoc of empresasSnapshot.docs) {
      const empresaId = empresaDoc.id;

      // Buscar en la subcolección de empleados de esta empresa
      const empleadosRef = collection(
        firestore,
        `absoluteClientes/${empresaId}/empleados`
      );
      const q = query(
        empleadosRef,
        where("iniciarSesion.telefono", "==", parseInt(telefono, 10)),
        where("iniciarSesion.contraseña", "==", contraseña)
      );

      const empleadosSnapshot = await getDocs(q);

      if (!empleadosSnapshot.empty) {
        const empleadoDoc = empleadosSnapshot.docs[0];
        const empleadoData = empleadoDoc.data();

        // Verificar si el empleado está activo
        if (empleadoData.datos?.estado !== "activo") {
          throw new Error("Este usuario está inactivo");
        }

        const empleado: EmpleadoProps = {
          id: empleadoDoc.id,
          empresaId: empresaId,
          datos: empleadoData.datos,
          iniciarSesion: empleadoData.iniciarSesion,
        };

        return empleado;
      }
    }

    // Si llegamos aquí, no se encontró ninguna coincidencia
    return null;
  } catch (error) {
    console.error("Error al verificar credenciales de empleado:", error);
    throw error;
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

    // También verificamos si existe un empleado con ese teléfono
    const empresasSnapshot = await getDocs(clientesRef);

    for (const empresaDoc of empresasSnapshot.docs) {
      const empresaId = empresaDoc.id;
      const empleadosRef = collection(
        firestore,
        `absoluteClientes/${empresaId}/empleados`
      );
      const q = query(
        empleadosRef,
        where("iniciarSesion.telefono", "==", parseInt(telefono, 10))
      );

      const empleadosSnapshot = await getDocs(q);
      if (!empleadosSnapshot.empty) {
        return true; // Ya existe un empleado con este teléfono
      }
    }

    return false; // El teléfono no está registrado
  } catch (error) {
    console.error("Error al verificar teléfono existente:", error);
    return false; // En caso de error, permitimos continuar
  }
};

// Función para crear un nuevo empleado
export const crearEmpleado = async (
  empresaId: string,
  nombre: string,
  telefono: string,
  contraseña: string,
  rol: string,
  permisos: string[] = ["dashboard"],
  salario: number = 0
): Promise<string> => {
  const firestore = getFirestore();
  const empleadoId = uuidv4();
  const empleadoRef = doc(
    firestore,
    `absoluteClientes/${empresaId}/empleados`,
    empleadoId
  );

  const fechaActual = new Date();

  const datosEmpleado = {
    datos: {
      nombre: nombre,
      rol: rol,
      estado: "activo",
      permisos: permisos,
      fechaContratacion: fechaActual,
      salario: salario,
      fechaCreado: fechaActual,
      ultimaActualizacion: fechaActual,
      ultimoAcceso: null,
    },
    iniciarSesion: {
      telefono: parseInt(telefono, 10),
      contraseña: contraseña,
    },
  };

  await setDoc(empleadoRef, datosEmpleado);

  return empleadoId;
};

// Función para obtener todos los empleados de una empresa
export const obtenerEmpleadosDeEmpresa = async (
  empresaId: string
): Promise<EmpleadoProps[]> => {
  const firestore = getFirestore();
  const empleadosRef = collection(
    firestore,
    `absoluteClientes/${empresaId}/empleados`
  );

  const querySnapshot = await getDocs(empleadosRef);

  const empleados: EmpleadoProps[] = [];

  querySnapshot.forEach((doc) => {
    const empleadoData = doc.data();
    empleados.push({
      id: doc.id,
      empresaId: empresaId,
      datos: empleadoData.datos,
      iniciarSesion: empleadoData.iniciarSesion,
    });
  });

  return empleados;
};

// Función para actualizar datos del empleado
export const actualizarEmpleado = async (
  empresaId: string,
  empleadoId: string,
  datosActualizados: Partial<EmpleadoProps>
): Promise<void> => {
  const firestore = getFirestore();
  const empleadoRef = doc(
    firestore,
    `absoluteClientes/${empresaId}/empleados`,
    empleadoId
  );

  // Preparamos los datos para la actualización
  const actualizacion: any = {};

  // Si hay datos en el objeto datos, los incluimos
  if (datosActualizados.datos) {
    Object.entries(datosActualizados.datos).forEach(([key, value]) => {
      actualizacion[`datos.${key}`] = value;
    });
  }

  // Si hay datos en iniciarSesion, los incluimos
  if (datosActualizados.iniciarSesion) {
    Object.entries(datosActualizados.iniciarSesion).forEach(([key, value]) => {
      actualizacion[`iniciarSesion.${key}`] = value;
    });
  }

  // Actualizamos la fecha de última actualización
  actualizacion["datos.ultimaActualizacion"] = new Date();

  await updateDoc(empleadoRef, actualizacion);
};

// Función para eliminar un empleado
export const eliminarEmpleado = async (
  empresaId: string,
  empleadoId: string
): Promise<void> => {
  const firestore = getFirestore();
  const empleadoRef = doc(
    firestore,
    `absoluteClientes/${empresaId}/empleados`,
    empleadoId
  );

  // En lugar de eliminar realmente, marcamos como inactivo
  await updateDoc(empleadoRef, {
    "datos.estado": "inactivo",
    "datos.ultimaActualizacion": new Date(),
  });
};
