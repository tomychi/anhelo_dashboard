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
  onSnapshot,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  Query,
  DocumentData,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Interfaces
export interface DatosGeneralesEmpresa {
  nombre: string;
  cantidadEmpleados: string;
  formaJuridica: string;
  rubro: string; // Añadimos el campo rubro
  fechaCreacion: Date;
}

export interface DatosUsuario {
  nombreUsuario: string;
  telefono: string;
  contraseña: string;
  rolUsuario: string;
}

export interface ConfigEmpresa {
  coleccionesDisponibles: string[];
  featuresActivos: string[];
  ultimaActualizacion: Date;
}

export interface EmpresaProps {
  id?: string;
  datosGenerales: DatosGeneralesEmpresa;
  datosUsuario: DatosUsuario;
  featuresIniciales: string[];
  config?: ConfigEmpresa;
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

// Mapeo de features a las colecciones necesarias
const FEATURE_A_COLECCIONES = {
  Dashboard: ["pedidos"], //siempre tenemos esto porque en el form no dejamos deseleccionarlo
  "Facturación automática": [], //esto solo necesita la coleccion pedidos que ya esta creada
  Operaciones: [], //esto solo necesita la coleccion pedidos que ya esta creada
  Empleados: ["empleados"], //lo unico que necesitamos para manejar los empleados
  Inversores: ["inversion"], //lo unico que necesitamos para manejar los inversores
  Finanzas: ["gastos", "materiales"], //gastos para almacenar las compras y materiales para tener el valor de la materia prima y poder calcular el neto
  "Página de ventas": ["productos"], //si selecciona solo la pagina le basta con tener la coleccion pedidos que ya esta creada + la de productos, despues otros features como ej campañas de vouchers y demas se agrega si marca esos features, no es necesidad crearlos aca.
  "Precios dinámicos": ["constantes"], //esto solo necesita la coleccion pedidos que ya esta creada + constantes
  "WhatsApp Marketing": ["vouchers"], //esto necesita la coleccion pedidos (que ya esta creada) + vouchers que es lo que le enviamos a los clientes
};

// Función para inicializar la estructura de colecciones según los features seleccionados
const inicializarColeccionesCliente = async (
  empresaId: string,
  featuresSeleccionados: string[]
): Promise<string[]> => {
  const firestore = getFirestore();

  // Conjunto para almacenar colecciones únicas (evitar duplicados)
  const coleccionesUnicas = new Set<string>();

  // Siempre añadir algunas colecciones básicas que son necesarias independientemente de los features
  const coleccionesBasicas = ["pedidos"];
  coleccionesBasicas.forEach((col) => coleccionesUnicas.add(col));

  // Añadir colecciones basadas en los features seleccionados
  featuresSeleccionados.forEach((feature) => {
    const colecciones = FEATURE_A_COLECCIONES[feature] || [];
    colecciones.forEach((col) => coleccionesUnicas.add(col));
  });

  // Crear cada colección única
  for (const nombreColeccion of coleccionesUnicas) {
    // Creamos un documento inicial para que la colección exista
    const docRef = doc(
      firestore,
      `absoluteClientes/${empresaId}/${nombreColeccion}/inicial`
    );

    // Documento simple que indica la creación de la colección
    await setDoc(docRef, {
      creado: new Date(),
      descripcion: `Documento inicial para la colección ${nombreColeccion}`,
      _esDocumentoSistema: true,
    });

    console.log(
      `Colección ${nombreColeccion} inicializada para empresa ${empresaId}`
    );
  }

  return Array.from(coleccionesUnicas);
};

// Función para crear una nueva empresa
export const crearEmpresa = async (
  nombreUsuario: string,
  telefono: string,
  contraseña: string,
  nombreEmpresa: string,
  cantidadEmpleados: string,
  formaJuridica: string,
  rolUsuario: string,
  featuresSeleccionados: string[],
  rubro: string // Nuevo parámetro para el rubro
): Promise<string> => {
  const firestore = getFirestore();
  const empresaId = uuidv4();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);

  const fechaActual = new Date();

  // Inicializar las colecciones según los features seleccionados y obtener la lista
  const coleccionesCreadas = await inicializarColeccionesCliente(
    empresaId,
    featuresSeleccionados
  );

  const datosEmpresa: EmpresaProps = {
    id: empresaId,
    datosGenerales: {
      nombre: nombreEmpresa,
      cantidadEmpleados: cantidadEmpleados,
      formaJuridica: formaJuridica,
      rubro: rubro, // Añadimos el rubro a los datos generales
      fechaCreacion: fechaActual,
    },
    datosUsuario: {
      nombreUsuario: nombreUsuario,
      telefono: telefono,
      contraseña: contraseña,
      rolUsuario: rolUsuario,
    },
    featuresIniciales: featuresSeleccionados,
    // Almacenar la configuración directamente en el documento de la empresa
    config: {
      coleccionesDisponibles: coleccionesCreadas,
      featuresActivos: featuresSeleccionados,
      ultimaActualizacion: fechaActual,
    },
    estado: "activo",
    ultimaActualizacion: fechaActual,
  };

  // Crear el documento principal de la empresa
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
        where("iniciarSesion.telefono", "==", telefono), // Cambiado: ya no convierte a entero
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

// Función para actualizar la configuración de la empresa
export const actualizarConfiguracionEmpresa = async (
  empresaId: string,
  nuevaConfig: Partial<ConfigEmpresa>
): Promise<void> => {
  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);

  // Primero obtenemos la configuración actual
  const docSnap = await getDoc(empresaRef);

  if (!docSnap.exists()) {
    throw new Error("La empresa no existe");
  }

  const empresaData = docSnap.data();
  const configActual = empresaData.config || {};

  // Mezclamos la configuración actual con la nueva
  const configActualizada = {
    ...configActual,
    ...nuevaConfig,
    ultimaActualizacion: new Date(),
  };

  // Actualizamos solo el campo config
  await updateDoc(empresaRef, {
    config: configActualizada,
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
      telefono: telefono,
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

export const obtenerNombreEmpresa = async (
  empresaId: string
): Promise<string> => {
  if (!empresaId) return "";

  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);
  const docSnap = await getDoc(empresaRef);

  if (docSnap.exists()) {
    return docSnap.data().datosGenerales?.nombre || "";
  } else {
    return "";
  }
};

/**
 * Obtiene las colecciones disponibles para una empresa específica
 * @param empresaId ID de la empresa
 * @returns Array con los nombres de las colecciones disponibles
 */
export const obtenerColeccionesDisponibles = async (
  empresaId: string
): Promise<string[]> => {
  if (!empresaId) return [];

  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);
  const docSnap = await getDoc(empresaRef);

  if (docSnap.exists() && docSnap.data().config?.coleccionesDisponibles) {
    return docSnap.data().config.coleccionesDisponibles;
  } else {
    // Si no hay configuración, devolvemos un conjunto mínimo de colecciones básicas
    return ["registros", "users"];
  }
};

/**
 * Verifica si una empresa tiene acceso a una colección específica
 * @param empresaId ID de la empresa
 * @param nombreColeccion Nombre de la colección a verificar
 * @returns Booleano indicando si la empresa tiene acceso
 */
export const tieneAccesoAColeccion = async (
  empresaId: string,
  nombreColeccion: string
): Promise<boolean> => {
  if (!empresaId) return false;

  const coleccionesDisponibles = await obtenerColeccionesDisponibles(empresaId);
  return coleccionesDisponibles.includes(nombreColeccion);
};

/**
 * Obtiene los features activos de una empresa
 * @param empresaId ID de la empresa
 * @returns Array con los nombres de los features activos
 */
export const obtenerFeaturesActivos = async (
  empresaId: string
): Promise<string[]> => {
  if (!empresaId) return [];

  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);
  const docSnap = await getDoc(empresaRef);

  if (docSnap.exists()) {
    // Intentamos obtener primero de config.featuresActivos y si no existe, de featuresIniciales
    const empresa = docSnap.data();
    return empresa.config?.featuresActivos || empresa.featuresIniciales || [];
  } else {
    return [];
  }
};

// Funciones auxiliares para interactuar con colecciones

/**
 * Determina la ruta correcta para acceder a una colección según el modo de operación
 * @param coleccionNombre Nombre de la colección a acceder
 * @param clienteId ID del cliente (si es undefined, se accede a la colección principal)
 * @returns Referencia a la colección correspondiente
 */
export const obtenerColeccion = (
  coleccionNombre: string,
  clienteId?: string
): CollectionReference<DocumentData> => {
  const db = getFirestore();

  if (clienteId) {
    // Modo cliente: acceder a la colección dentro del documento del cliente
    return collection(db, `absoluteClientes/${clienteId}/${coleccionNombre}`);
  } else {
    // Modo principal: acceder a la colección en la raíz
    return collection(db, coleccionNombre);
  }
};

/**
 * Determina la ruta correcta para acceder a un documento específico
 * @param coleccionNombre Nombre de la colección que contiene el documento
 * @param documentoId ID del documento a acceder
 * @param clienteId ID del cliente (si es undefined, se accede al documento en la colección principal)
 * @returns Referencia al documento correspondiente
 */
export const obtenerDocumento = (
  coleccionNombre: string,
  documentoId: string,
  clienteId?: string
): DocumentReference<DocumentData> => {
  const db = getFirestore();

  if (clienteId) {
    // Modo cliente: documento dentro de la colección del cliente
    return doc(
      db,
      `absoluteClientes/${clienteId}/${coleccionNombre}`,
      documentoId
    );
  } else {
    // Modo principal: documento en la colección principal
    return doc(db, coleccionNombre, documentoId);
  }
};

/**
 * Crear un documento en la colección correcta según el modo de operación
 * @param coleccionNombre Nombre de la colección donde crear el documento
 * @param documentoId ID del documento a crear (si es undefined, Firestore generará uno)
 * @param datos Datos a guardar en el documento
 * @param clienteId ID del cliente (si es undefined, se crea en la colección principal)
 * @returns ID del documento creado
 */
export const crearDocumento = async (
  coleccionNombre: string,
  datos: any,
  documentoId?: string,
  clienteId?: string
): Promise<string> => {
  const db = getFirestore();
  let docRef: DocumentReference;

  if (documentoId) {
    // Usar el ID proporcionado
    docRef = obtenerDocumento(coleccionNombre, documentoId, clienteId);
  } else {
    // Generar un nuevo ID
    if (clienteId) {
      const coleccionRef = collection(
        db,
        `absoluteClientes/${clienteId}/${coleccionNombre}`
      );
      docRef = doc(coleccionRef);
    } else {
      const coleccionRef = collection(db, coleccionNombre);
      docRef = doc(coleccionRef);
    }
  }

  // Añadir timestamps
  const datosConTimestamp = {
    ...datos,
    creado: new Date(),
    actualizado: new Date(),
  };

  await setDoc(docRef, datosConTimestamp);
  return docRef.id;
};

/**
 * Actualizar un documento existente
 * @param coleccionNombre Nombre de la colección que contiene el documento
 * @param documentoId ID del documento a actualizar
 * @param datos Datos a actualizar
 * @param clienteId ID del cliente (si es undefined, se actualiza en la colección principal)
 */
export const actualizarDocumento = async (
  coleccionNombre: string,
  documentoId: string,
  datos: any,
  clienteId?: string
): Promise<void> => {
  const docRef = obtenerDocumento(coleccionNombre, documentoId, clienteId);

  // Añadir timestamp de actualización
  const datosConTimestamp = {
    ...datos,
    actualizado: new Date(),
  };

  await updateDoc(docRef, datosConTimestamp);
};

/**
 * Eliminar un documento
 * @param coleccionNombre Nombre de la colección que contiene el documento
 * @param documentoId ID del documento a eliminar
 * @param clienteId ID del cliente (si es undefined, se elimina de la colección principal)
 */
export const eliminarDocumento = async (
  coleccionNombre: string,
  documentoId: string,
  clienteId?: string
): Promise<void> => {
  const docRef = obtenerDocumento(coleccionNombre, documentoId, clienteId);
  await deleteDoc(docRef);
};

/**
 * Obtener todos los documentos de una colección
 * @param coleccionNombre Nombre de la colección
 * @param clienteId ID del cliente (si es undefined, se obtiene de la colección principal)
 * @returns Array de documentos
 */
export const obtenerTodosDocumentos = async (
  coleccionNombre: string,
  clienteId?: string
): Promise<DocumentData[]> => {
  const coleccionRef = obtenerColeccion(coleccionNombre, clienteId);
  const snapshot = await getDocs(coleccionRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Suscribirse a los cambios en una colección
 * @param coleccionNombre Nombre de la colección
 * @param callback Función a ejecutar cuando hay cambios
 * @param clienteId ID del cliente (si es undefined, se suscribe a la colección principal)
 * @returns Función para cancelar la suscripción
 */
export const suscribirseAColeccion = (
  coleccionNombre: string,
  callback: (datos: DocumentData[]) => void,
  clienteId?: string
): (() => void) => {
  const coleccionRef = obtenerColeccion(coleccionNombre, clienteId);

  const unsubscribe = onSnapshot(coleccionRef, (snapshot) => {
    const datos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(datos);
  });

  return unsubscribe;
};

/**
 * Consultar documentos con filtros
 * @param coleccionNombre Nombre de la colección
 * @param filtros Array de objetos {campo, operador, valor}
 * @param clienteId ID del cliente (si es undefined, se consulta en la colección principal)
 * @returns Array de documentos que cumplen los filtros
 */
export const consultarDocumentos = async (
  coleccionNombre: string,
  filtros: { campo: string; operador: string; valor: any }[],
  clienteId?: string
): Promise<DocumentData[]> => {
  const coleccionRef = obtenerColeccion(coleccionNombre, clienteId);

  // Construir la consulta con los filtros
  let consulta: Query = coleccionRef;

  filtros.forEach((filtro) => {
    consulta = query(
      consulta,
      where(filtro.campo, filtro.operador as any, filtro.valor)
    );
  });

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Función para añadir nuevas funcionalidades a una empresa existente
export const anadirFuncionalidadesEmpresa = async (
  empresaId: string,
  nuevasFuncionalidades: string[]
): Promise<void> => {
  const firestore = getFirestore();
  const empresaRef = doc(firestore, "absoluteClientes", empresaId);

  // Primero obtenemos la empresa actual para conocer sus funcionalidades existentes
  const empresaDoc = await getDoc(empresaRef);

  if (!empresaDoc.exists()) {
    throw new Error("No se encontró la empresa");
  }

  const empresaData = empresaDoc.data();
  const featuresExistentes = empresaData.featuresIniciales || [];
  const configActual = empresaData.config || {};

  // Combinar funcionalidades existentes con las nuevas (evitar duplicados)
  const funcionalidadesActualizadas = Array.from(
    new Set([...featuresExistentes, ...nuevasFuncionalidades])
  );

  // Inicializar las nuevas colecciones para las nuevas funcionalidades
  const coleccionesExistentes = configActual.coleccionesDisponibles || [];
  const nuevasColecciones = await inicializarColeccionesAdicionales(
    empresaId,
    nuevasFuncionalidades,
    coleccionesExistentes
  );

  // Actualizar la empresa con las nuevas funcionalidades y colecciones
  await updateDoc(empresaRef, {
    featuresIniciales: funcionalidadesActualizadas,
    "config.featuresActivos": funcionalidadesActualizadas,
    "config.coleccionesDisponibles": nuevasColecciones,
    "config.ultimaActualizacion": new Date(),
    ultimaActualizacion: new Date(),
  });
};

// Función para inicializar solo las colecciones necesarias para las nuevas funcionalidades
const inicializarColeccionesAdicionales = async (
  empresaId: string,
  nuevasFuncionalidades: string[],
  coleccionesExistentes: string[]
): Promise<string[]> => {
  const firestore = getFirestore();

  // Conjunto para almacenar colecciones únicas (incluidas las existentes)
  const coleccionesUnicas = new Set<string>(coleccionesExistentes);

  // Añadir colecciones basadas en los nuevos features
  nuevasFuncionalidades.forEach((feature) => {
    const colecciones = FEATURE_A_COLECCIONES[feature] || [];
    colecciones.forEach((col) => coleccionesUnicas.add(col));
  });

  // Determinar qué colecciones son nuevas
  const coleccionesNuevas = Array.from(coleccionesUnicas).filter(
    (col) => !coleccionesExistentes.includes(col)
  );

  // Crear cada colección nueva
  for (const nombreColeccion of coleccionesNuevas) {
    // Creamos un documento inicial para que la colección exista
    const docRef = doc(
      firestore,
      `absoluteClientes/${empresaId}/${nombreColeccion}/inicial`
    );

    // Documento simple que indica la creación de la colección
    await setDoc(docRef, {
      creado: new Date(),
      descripcion: `Documento inicial para la colección ${nombreColeccion}`,
      _esDocumentoSistema: true,
    });

    console.log(
      `Colección ${nombreColeccion} inicializada para empresa ${empresaId}`
    );
  }

  return Array.from(coleccionesUnicas);
};

/**
 * Obtiene la configuración de KPIs para una empresa específica
 * @param empresaId ID de la empresa
 * @returns Objeto con la configuración de KPIs donde las claves son los IDs de KPI y los valores son arrays con IDs de empleados
 */
export const getKpiConfig = async (
  empresaId: string
): Promise<{ [kpiKey: string]: string[] }> => {
  if (!empresaId) return {};

  const firestore = getFirestore();
  try {
    // Referencia al documento principal de la empresa
    const empresaRef = doc(firestore, "absoluteClientes", empresaId);
    const empresaDoc = await getDoc(empresaRef);

    // Si existe y tiene el campo config.dashboard.kpis, lo devolvemos
    if (empresaDoc.exists() && empresaDoc.data()?.config?.dashboard) {
      return empresaDoc.data().config.dashboard;
    }

    // Si no existe, devolvemos un objeto vacío
    return {};
  } catch (error) {
    console.error("Error al obtener configuración de KPIs:", error);
    return {};
  }
};
/**
 * Verifica si un usuario tiene permiso para ver un KPI específico
 * @param kpiKey Clave del KPI a verificar
 * @param kpiConfig Configuración de KPIs
 * @param usuarioId ID del usuario actual
 * @returns true si tiene permiso, false si no
 */
export const hasKpiPermission = (
  kpiKey: string,
  kpiConfig: { [kpiKey: string]: string[] },
  usuarioId: string
): boolean => {
  // Si no hay configuración para este KPI, no mostrarlo
  if (!kpiConfig[kpiKey]) {
    return false;
  }

  // Verificar si el ID del usuario está en la lista de acceso
  return kpiConfig[kpiKey].includes(usuarioId);
};

/**
 * Inicializa la configuración del dashboard para una nueva empresa
 * @param empresaId ID de la empresa
 * @param adminId ID del administrador/dueño de la empresa
 */
export const initDashboardConfig = async (
  empresaId: string,
  adminId: string
): Promise<void> => {
  if (!empresaId || !adminId) return;

  const firestore = getFirestore();
  try {
    // Referencia al documento de configuración
    const configRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "config",
      "dashboard"
    );

    // Verificar si ya existe configuración
    const configDoc = await getDoc(configRef);
    if (configDoc.exists()) {
      console.log("La configuración de dashboard ya existe para esta empresa");
      return;
    }

    // KPIs básicos que serán visibles para el administrador por defecto
    const defaultKpis = {
      bruto: [adminId],
      neto: [adminId],
      productos: [adminId],
      delivery: [adminId],
      takeaway: [adminId],
      ticket: [adminId],
      general: [adminId],
    };

    // Crear la configuración inicial
    await setDoc(configRef, {
      kpis: defaultKpis,
      ultimaActualizacion: new Date(),
    });

    console.log("Configuración de dashboard inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar configuración de dashboard:", error);
  }
};

/**
 * Configura el acceso a KPIs para un empleado
 * @param empresaId ID de la empresa
 * @param empleadoId ID del empleado
 * @param kpiKeys Array con las claves de los KPIs a los que tendrá acceso
 */
export const configureKpisForEmpleado = async (
  empresaId: string,
  empleadoId: string,
  kpiKeys: string[]
): Promise<void> => {
  if (!empresaId || !empleadoId) return;

  const firestore = getFirestore();
  try {
    // Referencia al documento de configuración
    const configRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "config",
      "dashboard"
    );

    // Obtener configuración actual
    const configDoc = await getDoc(configRef);
    let kpiConfig: { [kpiKey: string]: string[] } = {};

    if (configDoc.exists() && configDoc.data()?.kpis) {
      kpiConfig = configDoc.data().kpis;
    }

    // Actualizar la configuración
    kpiKeys.forEach((kpiKey) => {
      if (!kpiConfig[kpiKey]) {
        kpiConfig[kpiKey] = [];
      }

      if (!kpiConfig[kpiKey].includes(empleadoId)) {
        kpiConfig[kpiKey].push(empleadoId);
      }
    });

    // Guardar cambios
    if (configDoc.exists()) {
      await updateDoc(configRef, {
        kpis: kpiConfig,
        ultimaActualizacion: new Date(),
      });
    } else {
      await setDoc(configRef, {
        kpis: kpiConfig,
        ultimaActualizacion: new Date(),
      });
    }
  } catch (error) {
    console.error("Error al configurar KPIs para empleado:", error);
  }
};

/**
 * Actualiza la configuración completa de KPIs para una empresa
 * @param empresaId ID de la empresa
 * @param kpiConfig Nueva configuración de KPIs
 */
export const updateKpiConfig = async (
  empresaId: string,
  kpiConfig: { [kpiKey: string]: string[] }
): Promise<void> => {
  if (!empresaId) return;

  const firestore = getFirestore();
  try {
    // Obtener referencia al documento principal de la empresa
    const empresaRef = doc(firestore, "absoluteClientes", empresaId);

    // Obtener documento actual para actualizar la configuración
    const empresaDoc = await getDoc(empresaRef);

    if (!empresaDoc.exists()) {
      throw new Error("La empresa no existe");
    }

    // Obtener la configuración actual
    const currentData = empresaDoc.data();
    const currentConfig = currentData.config || {};

    // Crear la configuración actualizada
    const updatedConfig = {
      ...currentConfig,
      dashboard: kpiConfig,
      ultimaActualizacion: new Date(),
    };

    // Actualizar la configuración en Firestore
    await updateDoc(empresaRef, {
      config: updatedConfig,
      ultimaActualizacion: new Date(),
    });

    console.log("Configuración de KPIs actualizada correctamente");
  } catch (error) {
    console.error("Error al actualizar configuración de KPIs:", error);
    throw error;
  }
};

/**
 * Elimina el acceso de un empleado a todos los KPIs
 * @param empresaId ID de la empresa
 * @param empleadoId ID del empleado
 */
export const removeEmpleadoFromAllKpis = async (
  empresaId: string,
  empleadoId: string
): Promise<void> => {
  if (!empresaId || !empleadoId) return;

  const firestore = getFirestore();
  try {
    const configRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "config",
      "dashboard"
    );
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists() || !configDoc.data()?.kpis) {
      return;
    }

    const kpiConfig = configDoc.data().kpis;
    let updated = false;

    // Eliminar al empleado de todas las listas de acceso
    Object.keys(kpiConfig).forEach((kpiKey) => {
      if (kpiConfig[kpiKey].includes(empleadoId)) {
        kpiConfig[kpiKey] = kpiConfig[kpiKey].filter((id) => id !== empleadoId);
        updated = true;
      }
    });

    // Solo actualizar si hubo cambios
    if (updated) {
      await updateDoc(configRef, {
        kpis: kpiConfig,
        ultimaActualizacion: new Date(),
      });
    }
  } catch (error) {
    console.error("Error al eliminar empleado de KPIs:", error);
  }
};

/**
 * Obtiene los IDs de KPIs disponibles para un empleado
 * @param empresaId ID de la empresa
 * @param empleadoId ID del empleado
 * @returns Array con las claves de los KPIs a los que tiene acceso
 */
export const getEmpleadoKpis = async (
  empresaId: string,
  empleadoId: string
): Promise<string[]> => {
  if (!empresaId || !empleadoId) return [];

  try {
    const kpiConfig = await getKpiConfig(empresaId);
    const empleadoKpis: string[] = [];

    Object.entries(kpiConfig).forEach(([kpiKey, empleados]) => {
      if (empleados.includes(empleadoId)) {
        empleadoKpis.push(kpiKey);
      }
    });

    return empleadoKpis;
  } catch (error) {
    console.error("Error al obtener KPIs del empleado:", error);
    return [];
  }
};
