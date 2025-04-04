import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import {
  crearEmpleado,
  obtenerEmpleadosDeEmpresa,
  actualizarEmpleado,
  eliminarEmpleado,
} from "../firebase/ClientesAbsolute";
import { SYSTEM_FEATURES } from "../utils/permissionsUtils";
import LoadingPoints from "../components/LoadingPoints"; // Importando el componente de carga
import arrowIcon from "../assets/arrowIcon.png"; // Importar el icono de flecha
import { doc, getFirestore, updateDoc, onSnapshot } from "firebase/firestore"; // Importar Firestore para actualizar el empresario

// Componente Toggle reutilizable para permisos
const TogglePermiso = ({ isOn, onToggle, label }) => (
  <div className="flex items-center justify-between w-full pb-2  ">
    <p className="text-sm">{label}</p>
    <div
      className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? "bg-black" : "bg-gray-200"
      }`}
      onClick={onToggle}
    >
      <div
        className={`bg-gray-100 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isOn ? "translate-x-6" : ""
        }`}
      />
    </div>
  </div>
);

export const Empleados = () => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [rol, setRol] = useState("");
  const [salario, setSalario] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [estado, setEstado] = useState("activo");
  const [searchTerm, setSearchTerm] = useState(""); // Añadido para filtrar empleados
  const [isLoadingEmpleados, setIsLoadingEmpleados] = useState(false); // Estado de carga específico para la tabla

  // Estados adicionales para el empresario
  const [editingEmpresario, setEditingEmpresario] = useState(false);
  const [empresarioNombre, setEmpresarioNombre] = useState("");
  const [empresarioTelefono, setEmpresarioTelefono] = useState("");
  const [empresarioContraseña, setEmpresarioContraseña] = useState("");
  const [empresarioConfirmarContraseña, setEmpresarioConfirmarContraseña] =
    useState("");

  // Estados para datos en tiempo real
  const [empresaDatos, setEmpresaDatos] = useState(null);
  const [empresarioDataLocal, setEmpresarioDataLocal] = useState(null);

  // Modal drag states
  const [isEditAnimating, setIsEditAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const editModalRef = useRef(null);

  // Estados para controlar el indicador de scroll en el modal de edición
  const [isScrollNeeded, setIsScrollNeeded] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const editContentRef = useRef(null);

  // Obtener datos de la empresa del estado de redux
  const auth = useSelector((state: RootState) => state.auth);
  const empresa = auth.usuario;
  const tipoUsuario = auth.tipoUsuario;
  const empresaId = tipoUsuario === "empresa" ? empresa?.id : "";

  // Obtener los features disponibles para usar como permisos
  const featuresDisponibles =
    tipoUsuario === "empresa" ? empresa?.featuresIniciales || [] : [];

  // Añadir efecto para suscribirse a cambios en tiempo real
  useEffect(() => {
    if (empresaId) {
      // Suscribirse a cambios en tiempo real del documento de la empresa
      const empresaRef = doc(getFirestore(), "absoluteClientes", empresaId);
      const unsubscribe = onSnapshot(empresaRef, (docSnap) => {
        if (docSnap.exists()) {
          const empresaData = docSnap.data();

          // Actualizar el estado local con los datos más recientes
          setEmpresaDatos(empresaData);

          // Crear datos del empresario basados en los datos nuevos
          if (empresaData.datosUsuario) {
            const nuevoEmpresarioData = {
              id: "empresario",
              datos: {
                nombre: empresaData.datosUsuario.nombreUsuario || "Empresario",
                rol: empresaData.datosUsuario.rolUsuario || "Dueño",
                estado: "activo",
                permisos: empresaData.featuresIniciales || [],
                esEmpresario: true,
              },
              iniciarSesion: {
                telefono: empresaData.datosUsuario.telefono || "",
              },
            };

            setEmpresarioDataLocal(nuevoEmpresarioData);
          }
        }
      });

      // Limpiar la suscripción cuando el componente se desmonte
      return () => unsubscribe();
    }
  }, [empresaId]); // Solo se ejecuta cuando cambia empresaId

  // Inicializar los toggles de permisos
  const [editPermisosToggles, setEditPermisosToggles] = useState({});

  useEffect(() => {
    const initialToggles = {};
    SYSTEM_FEATURES.forEach((feature) => {
      initialToggles[feature.id] = false;
    });
    setEditPermisosToggles(initialToggles);
  }, []);

  // Efecto para cargar empleados al montar el componente
  useEffect(() => {
    if (empresaId) {
      fetchEmpleados();
    }
  }, [empresaId]);

  // Efecto para verificar si se necesita scroll en el modal de edición
  useEffect(() => {
    // Solo ejecutar esta lógica cuando el modal de edición está abierto
    if (showEditForm && editContentRef.current) {
      const checkIfScrollNeeded = () => {
        const container = editContentRef.current;
        if (container) {
          // Si el contenido es más alto que el contenedor, se necesita scroll
          setIsScrollNeeded(container.scrollHeight > container.clientHeight);
        }
      };

      // Verificar inmediatamente al abrir el modal
      checkIfScrollNeeded();

      // También verificar cuando cambia el tamaño de la ventana
      window.addEventListener("resize", checkIfScrollNeeded);

      return () => {
        window.removeEventListener("resize", checkIfScrollNeeded);
      };
    } else {
      // Resetear el estado cuando el modal se cierra
      setIsScrollNeeded(false);
      setIsNearBottom(false);
    }
  }, [showEditForm, selectedEmpleado]);

  // Función para manejar el evento de scroll en el modal de edición
  const handleEditModalScroll = () => {
    const container = editContentRef.current;
    if (container) {
      const scrollBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      // Considerar "cerca del fondo" si estamos a menos de 20px del final
      setIsNearBottom(scrollBottom < 20);

      // Considerar "desplazado hacia abajo" si hemos scrolleado más de 20px
      setIsScrolledDown(container.scrollTop > 20);
    }
  };

  const fetchEmpleados = async () => {
    setIsLoadingEmpleados(true);
    try {
      const empleadosData = await obtenerEmpleadosDeEmpresa(empresaId);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      setError("No se pudieron cargar los empleados. Intente nuevamente.");
    } finally {
      setIsLoadingEmpleados(false);
    }
  };

  useEffect(() => {
    if (showEditForm) {
      setIsEditAnimating(true);
      setCurrentTranslate(0);
    }
  }, [showEditForm]);

  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleMouseDown = (e) => {
    setDragStart(e.clientY);
  };

  const handleTouchMove = (e) => {
    if (dragStart === null) return;
    const currentPosition = e.touches[0].clientY;
    const difference = currentPosition - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleMouseMove = (e) => {
    if (dragStart === null) return;
    const difference = e.clientY - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleDragEnd = () => {
    if (currentTranslate > 200) {
      if (showEditForm) handleCloseEditForm();
    } else {
      setCurrentTranslate(0);
    }
    setDragStart(null);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragStart !== null) {
        handleDragEnd();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragStart, currentTranslate]);

  const handleToggleEditPermiso = (permiso) => {
    setEditPermisosToggles((prev) => ({
      ...prev,
      [permiso]: !prev[permiso],
    }));
  };

  const handleCreateEmpleado = async () => {
    // Validar campos
    if (!nombre || !telefono || !contraseña || !rol) {
      setError("Por favor, completa todos los campos obligatorios");
      return;
    }

    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!empresaId) {
      setError("No se encontró información de la empresa");
      return;
    }

    // Obtener los permisos seleccionados
    const permisosSeleccionados = Object.keys(editPermisosToggles).filter(
      (key) => editPermisosToggles[key]
    );

    if (permisosSeleccionados.length === 0) {
      setError("Selecciona al menos un permiso");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await crearEmpleado(
        empresaId,
        nombre,
        telefono,
        contraseña,
        rol,
        permisosSeleccionados,
        salario || 0
      );

      // Limpiar el formulario y cerrar
      handleCloseEditForm();

      // Recargar la lista de empleados
      fetchEmpleados();
    } catch (error) {
      console.error("Error al crear empleado:", error);
      setError("Error al crear el empleado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmpleado = async () => {
    if (!selectedEmpleado || !empresaId) {
      setError("No se puede actualizar el empleado");
      return;
    }

    // Validar campos
    if (!nombre || !rol) {
      setError("Por favor, completa todos los campos obligatorios");
      return;
    }

    // Si se cambió la contraseña, verificar que coincidan
    if (contraseña && contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Obtener los permisos seleccionados
    const permisosSeleccionados = Object.keys(editPermisosToggles).filter(
      (key) => editPermisosToggles[key]
    );

    if (permisosSeleccionados.length === 0) {
      setError("Selecciona al menos un permiso");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const datosActualizados = {
        datos: {
          nombre,
          rol,
          estado,
          permisos: permisosSeleccionados,
        },
      };

      // Solo actualizar el salario si está definido
      if (salario !== undefined) {
        datosActualizados.datos.salario = salario;
      }

      // Verificar y actualizar contraseña y teléfono
      // Solo actualizar la contraseña si se ingresó una nueva
      if (contraseña) {
        datosActualizados.iniciarSesion = {
          contraseña,
        };

        // Solo actualizar el teléfono si se modificó
        if (telefono) {
          datosActualizados.iniciarSesion.telefono = telefono;
        }
      } else if (telefono) {
        // Si no hay contraseña nueva pero sí teléfono nuevo
        datosActualizados.iniciarSesion = {
          telefono,
        };
      }

      await actualizarEmpleado(
        empresaId,
        selectedEmpleado.id,
        datosActualizados
      );

      // Limpiar el formulario y cerrar
      handleCloseEditForm();

      // Recargar la lista de empleados
      fetchEmpleados();
    } catch (error) {
      console.error("Error al actualizar empleado:", error);
      setError("Error al actualizar el empleado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmpleado = async (empleadoId) => {
    console.log("Intentando eliminar empleado con ID:", empleadoId);

    if (!empresaId || !empleadoId) {
      console.log("Error: ID de empresa o empleado faltante", {
        empresaId,
        empleadoId,
      });
      return;
    }

    if (
      window.confirm(
        "¿Estás seguro de querer desactivar este empleado? No aparecerá en la lista pero se conservará en el sistema."
      )
    ) {
      setLoading(true);
      try {
        console.log("Enviando solicitud de eliminación para:", {
          empresaId,
          empleadoId,
        });
        await eliminarEmpleado(empresaId, empleadoId);
        console.log("Empleado eliminado exitosamente");
        fetchEmpleados();
      } catch (error) {
        console.error("Error al eliminar empleado:", error);
        alert("No se pudo eliminar el empleado. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenNewEmpleado = () => {
    // Resetear todos los campos del formulario
    setNombre("");
    setTelefono("");
    setContraseña("");
    setConfirmarContraseña("");
    setRol("");
    setSalario(undefined);
    setEstado("activo");

    // Resetear los permisos
    const initialToggles = {};
    SYSTEM_FEATURES.forEach((feature) => {
      initialToggles[feature.id] = false;
    });
    setEditPermisosToggles(initialToggles);

    // Marcar que estamos creando un nuevo empleado
    setIsCreatingNew(true);
    setSelectedEmpleado(null);
    setShowEditForm(true);
  };

  const handleEditEmpleado = (empleado) => {
    setSelectedEmpleado(empleado);
    setIsCreatingNew(false);
    setEditingEmpresario(false);

    // Cargar datos del empleado
    setNombre(empleado.datos?.nombre || "");
    setRol(empleado.datos?.rol || "");
    setEstado(empleado.datos?.estado || "activo");
    setSalario(empleado.datos?.salario);
    setTelefono(empleado.iniciarSesion?.telefono || "");

    // Resetear contraseñas
    setContraseña("");
    setConfirmarContraseña("");

    // Inicializar toggles de permisos
    const editToggles = {};
    // Añadir todos los permisos del sistema como falsas por defecto
    SYSTEM_FEATURES.forEach((feature) => {
      editToggles[feature.id] = false;
    });

    // Marcar como true los permisos que tiene el empleado
    if (empleado.datos?.permisos) {
      empleado.datos.permisos.forEach((permiso) => {
        editToggles[permiso] = true;
      });
    }

    setEditPermisosToggles(editToggles);
    setShowEditForm(true);

    // Resetear estados de scroll
    setIsScrollNeeded(false);
    setIsNearBottom(false);
  };

  // Función para manejar la edición del empresario
  const handleEditEmpresario = (empresarioData) => {
    setEditingEmpresario(true);
    setIsCreatingNew(false);
    setSelectedEmpleado(null);

    // Cargar datos del empresario
    setEmpresarioNombre(empresarioData.datos.nombre || "");
    setEmpresarioTelefono(empresarioData.iniciarSesion.telefono || "");
    setEmpresarioContraseña("");
    setEmpresarioConfirmarContraseña("");

    setShowEditForm(true);
  };

  // Función para actualizar los datos del empresario
  const handleUpdateEmpresario = async () => {
    if (!empresaId) {
      setError("No se encontró información de la empresa");
      return;
    }

    // Validar campos
    if (!empresarioNombre) {
      setError("Por favor, completa el nombre");
      return;
    }

    // Si se cambió la contraseña, verificar que coincidan
    if (
      empresarioContraseña &&
      empresarioContraseña !== empresarioConfirmarContraseña
    ) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Preparar los datos actualizados
      const datosActualizados = {
        "datosUsuario.nombreUsuario": empresarioNombre,
      };

      // Solo actualizar el teléfono si se modificó
      if (empresarioTelefono) {
        datosActualizados["datosUsuario.telefono"] = empresarioTelefono;
      }

      // Solo actualizar la contraseña si se ingresó una nueva
      if (empresarioContraseña) {
        datosActualizados["datosUsuario.contraseña"] = empresarioContraseña;
      }

      // Actualizar los datos de la empresa
      await updateDoc(
        doc(getFirestore(), "absoluteClientes", empresaId),
        datosActualizados
      );

      // Ya no necesitamos recargar la página, onSnapshot actualizará automáticamente
      console.log("Datos del empresario actualizados correctamente");

      // Cerrar el modal
      handleCloseEditForm();
    } catch (error) {
      console.error("Error al actualizar empresario:", error);
      setError("Error al actualizar los datos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedEmpleado(null);
    setIsCreatingNew(false);
    setEditingEmpresario(false);
    setNombre("");
    setTelefono("");
    setContraseña("");
    setConfirmarContraseña("");
    setRol("");
    setSalario(undefined);
    setEstado("activo");
    setEmpresarioNombre("");
    setEmpresarioTelefono("");
    setEmpresarioContraseña("");
    setEmpresarioConfirmarContraseña("");

    setError("");
    setCurrentTranslate(0);
    setIsEditAnimating(false);
  };

  const handleSaveEmpleado = () => {
    if (isCreatingNew) {
      handleCreateEmpleado();
    } else if (editingEmpresario) {
      handleUpdateEmpresario();
    } else {
      handleUpdateEmpleado();
    }
  };

  // Función para manejar la eliminación desde el modal
  const handleDeleteFromModal = () => {
    if (!selectedEmpleado || !selectedEmpleado.id) {
      console.log("No hay empleado seleccionado para eliminar");
      return;
    }

    // Guardar el ID antes de cerrar el modal
    const empleadoIdToDelete = selectedEmpleado.id;
    console.log("Guardando ID para eliminar:", empleadoIdToDelete);

    // Cerrar el modal primero
    handleCloseEditForm();

    // Luego eliminar usando el ID guardado
    handleDeleteEmpleado(empleadoIdToDelete);
  };

  // Utilizar los datos en tiempo real, con fallback a los datos de Redux
  const empresarioData =
    empresarioDataLocal ||
    (empresa?.datosUsuario
      ? {
          id: "empresario",
          datos: {
            nombre: empresa.datosUsuario.nombreUsuario || "Empresario",
            rol: empresa.datosUsuario.rolUsuario || "Dueño",
            estado: "activo",
            permisos: empresa?.featuresIniciales || [],
            esEmpresario: true,
          },
          iniciarSesion: {
            telefono: empresa.datosUsuario.telefono || "",
          },
        }
      : null);

  // Filtrar empleados: primero excluir los inactivos, luego aplicar el filtro de búsqueda
  const filteredEmpleados = empleados
    .filter((empleado) => empleado.datos?.estado !== "inactivo") // Excluir empleados inactivos
    .filter(
      (empleado) =>
        (empleado.datos?.nombre || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (empleado.datos?.rol || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (empleado.iniciarSesion?.telefono || "").includes(searchTerm)
    );

  return (
    <div className="font-coolvetica overflow-hidden flex flex-col items-center justify-center w-full">
      <div className="flex flex-row py-8 justify-between w-full px-4">
        <h2 className="text-3xl font-bold">Equipo</h2>
        <button
          onClick={handleOpenNewEmpleado}
          className="bg-gray-200 gap-2 text-black rounded-full flex items-center px-4 h-10 ml-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6"
          >
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="font-bold">Nuevo miembro</p>
        </button>
      </div>

      <div className="w-full px-4">
        <div className="flex items-center  w-full h-10 gap-1 mt-2 rounded-lg border-4 border-black focus:ring-0 font-coolvetica text-black text-xs font-light">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 ml-1.5 mb-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, rol o teléfono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="w-full mb-8 mt-4">
        {isLoadingEmpleados ? (
          <div className="flex justify-center items-center py-8">
            <LoadingPoints color="text-black" />
          </div>
        ) : filteredEmpleados.length > 0 ? (
          <div className="w-full">
            <table className="w-full text-xs text-left text-black">
              <thead className="text-black border-b h-10">
                <tr>
                  <th scope="col" className="pl-4 py-2">
                    Nombre
                  </th>
                  <th scope="col" className="pl-4 py-2">
                    Rol
                  </th>

                  <th scope="col" className="pl-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {/* Mostrar primero al empresario si existe y coincide con el filtro de búsqueda */}
                {empresarioData &&
                  (searchTerm === "" ||
                    empresarioData.datos.nombre
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    empresarioData.datos.rol
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    (empresarioData.iniciarSesion.telefono || "").includes(
                      searchTerm
                    )) && (
                    <tr
                      key="empresario"
                      className="text-black border-y font-light h-10 border-gray-200"
                    >
                      <td className="pl-4 font-light">
                        {empresarioData.datos.nombre}
                      </td>
                      <td className="pl-4 font-light">
                        {empresarioData.datos.rol
                          ? empresarioData.datos.rol.charAt(0).toUpperCase() +
                            empresarioData.datos.rol.slice(1).toLowerCase()
                          : ""}
                      </td>
                      <td className="pl-4 font-light pr-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleEditEmpresario(empresarioData)}
                            className="cursor-pointer hover:opacity-75 transition-opacity"
                            title="Editar datos del empresario"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-6"
                            >
                              <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                {filteredEmpleados.map((empleado) => (
                  <tr
                    key={empleado.id}
                    className="text-black border-y font-light h-10 border-gray-200"
                  >
                    <td className="pl-4 font-light">
                      {empleado.datos?.nombre || "Sin nombre"}
                    </td>
                    <td className="pl-4 font-light">
                      {empleado.datos?.rol
                        ? empleado.datos.rol.charAt(0).toUpperCase() +
                          empleado.datos.rol.slice(1).toLowerCase()
                        : "Sin rol"}
                    </td>

                    <td className="pl-4 font-light pr-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleEditEmpleado(empleado)}
                          className="cursor-pointer hover:opacity-75 transition-opacity "
                          title="Editar empleado"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-6"
                          >
                            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-xs font-light py-8 text-gray-400">
            {searchTerm
              ? "No se encontraron empleados que coincidan con la búsqueda"
              : "No hay empleados registrados"}
          </div>
        )}
      </div>

      {/* Modal para crear o editar empleado */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
              isEditAnimating ? "bg-opacity-50" : "bg-opacity-0"
            }`}
            style={{
              opacity: Math.max(0, 1 - currentTranslate / 400),
            }}
            onClick={handleCloseEditForm}
          />

          <div
            ref={editModalRef}
            className={`relative bg-gray-100 w-full max-w-4xl rounded-t-lg p pt-10 transition-transform duration-300 touch-none ${
              isEditAnimating ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
              transform: `translateY(${currentTranslate}px)`,
              maxHeight: "90vh",
              overflowY:
                "hidden" /* Cambiado de 'auto' a 'hidden' para controlar el scroll en el contenido interno */,
            }}
          >
            {/* Barra para arrastrar */}
            <div
              className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing z-10"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-1 bg-gray-200 rounded-full" />
              </div>
            </div>

            {/* Encabezado fijo */}
            <div className="sticky top-0 left-0 right-0 z-10 border-b p-4 bg-gray-100">
              <h2 className="text-2xl text-center font-bold">
                {isCreatingNew
                  ? "Nuevo miembro"
                  : editingEmpresario
                    ? "Editar empresario"
                    : "Editar miembro"}
              </h2>
            </div>

            {/* Contenido scrolleable con indicador de scroll */}
            <div className="relative flex flex-col h-full">
              <div
                ref={editContentRef}
                className="px-4 pt-4 overflow-y-auto flex-grow"
                style={{
                  maxHeight:
                    "calc(40vh - 0px)" /* Ajustado para dar espacio a los botones inferiores */,
                }}
                onScroll={handleEditModalScroll}
              >
                <h3 className="text-lg font-bold mb-2 text-center">Datos</h3>

                {editingEmpresario ? (
                  // Formulario para editar empresario
                  <>
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={empresarioNombre}
                      onChange={(e) => setEmpresarioNombre(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 rounded-t-3xl border-x border-t border-black transition-all"
                    />

                    <input
                      type="tel"
                      placeholder="Número de teléfono (dejar vacío para no cambiar)"
                      value={empresarioTelefono}
                      onChange={(e) => setEmpresarioTelefono(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
                    />

                    <input
                      type="password"
                      placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                      value={empresarioContraseña}
                      onChange={(e) => setEmpresarioContraseña(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
                    />

                    <input
                      type="password"
                      placeholder="Confirmar nueva contraseña"
                      value={empresarioConfirmarContraseña}
                      onChange={(e) =>
                        setEmpresarioConfirmarContraseña(e.target.value)
                      }
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black rounded-b-3xl border-black transition-all"
                    />
                  </>
                ) : (
                  // Formulario para empleados
                  <>
                    <input
                      type="text"
                      placeholder="Nombre y apellido"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 rounded-t-3xl border-x border-t border-black transition-all"
                    />

                    <input
                      type="tel"
                      placeholder={
                        isCreatingNew
                          ? "Número de teléfono"
                          : "Número de teléfono (dejar vacío para no cambiar)"
                      }
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
                    />

                    <input
                      type="password"
                      placeholder={
                        isCreatingNew
                          ? "Contraseña"
                          : "Nueva contraseña (dejar vacío para no cambiar)"
                      }
                      value={contraseña}
                      onChange={(e) => setContraseña(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
                    />

                    <input
                      type="password"
                      placeholder={
                        isCreatingNew
                          ? "Confirmar contraseña"
                          : "Confirmar nueva contraseña"
                      }
                      value={confirmarContraseña}
                      onChange={(e) => setConfirmarContraseña(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
                    />

                    <input
                      type="text"
                      placeholder="Rol o puesto"
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border rounded-b-3xl border-black transition-all"
                    />

                    {/* Sección de permisos */}
                    <div className="mt-8">
                      <h3 className="text-lg font-bold mb-2 text-center">
                        Permisos
                      </h3>
                      {SYSTEM_FEATURES.map((feature) => (
                        <TogglePermiso
                          key={feature.id}
                          label={feature.title}
                          isOn={editPermisosToggles[feature.id] || false}
                          onToggle={() => handleToggleEditPermiso(feature.id)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Mensaje de error */}
                {error && (
                  <div className="mt-4 mb-4 p-4 border-l-4 border-red-500">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Indicador de scroll hacia abajo */}
              {isScrollNeeded && !isNearBottom && (
                <div
                  className={`absolute ${isCreatingNew ? "bottom-0" : "bottom-0"} left-0 right-0 flex justify-center pointer-events-none`}
                >
                  <div className="bg-gradient-to-t from-gray-100 to-transparent h-20 w-full flex items-end justify-center pb-1">
                    <div className="animate-bounce bg-white border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center">
                      <img
                        src={arrowIcon}
                        className="h-2 transform rotate-90 "
                        alt="Desplazar para ver más"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Indicador de scroll hacia arriba */}
              {isScrollNeeded && isScrolledDown && (
                <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="bg-gradient-to-b from-gray-100 to-transparent h-20 w-full flex items-start justify-center pt-4">
                    <div className="animate-bounce bg-white border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center">
                      <img
                        src={arrowIcon}
                        className="h-2 transform -rotate-90"
                        alt="Desplazar hacia arriba"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón fijo al final */}
            <div className="sticky bottom-0 bg-gray-100 border-t left-0 right-0 px-4 py-3 z-10 shadow-md">
              <button
                onClick={handleSaveEmpleado}
                disabled={loading}
                className="w-full bg-black h-20 flex flex-col items-center justify-center rounded-3xl mb-3"
              >
                {loading ? (
                  <LoadingPoints color="text-gray-100" />
                ) : (
                  <p className="text-gray-100 text-3xl">
                    {isCreatingNew
                      ? "Crear"
                      : editingEmpresario
                        ? "Actualizar"
                        : "Actualizar"}
                  </p>
                )}
              </button>

              {/* Botón de eliminar (solo visible en modo edición, no en creación ni edición de empresario) */}
              {!isCreatingNew && !editingEmpresario && (
                <button
                  onClick={handleDeleteFromModal}
                  disabled={loading}
                  className="w-full bg-gray-200 h-20 flex flex-col items-center justify-center rounded-3xl"
                >
                  <p className="text-red-main text-3xl">Desactivar</p>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;
