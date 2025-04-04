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
  const [showForm, setShowForm] = useState(false);
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

  const [estado, setEstado] = useState("activo");
  const [searchTerm, setSearchTerm] = useState(""); // Añadido para filtrar empleados
  const [isLoadingEmpleados, setIsLoadingEmpleados] = useState(false); // Estado de carga específico para la tabla

  // Modal drag states
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditAnimating, setIsEditAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);
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

  // Inicializar los toggles de permisos
  const [permisosToggles, setPermisosToggles] = useState({});
  const [editPermisosToggles, setEditPermisosToggles] = useState({});

  useEffect(() => {
    const initialToggles = {};
    SYSTEM_FEATURES.forEach((feature) => {
      initialToggles[feature.id] = false;
    });
    setPermisosToggles(initialToggles);
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
    if (showForm) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [showForm]);

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
      if (showForm) handleCloseForm();
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

  const handleTogglePermiso = (permiso) => {
    setPermisosToggles((prev) => ({
      ...prev,
      [permiso]: !prev[permiso],
    }));
  };

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
    const permisosSeleccionados = Object.keys(permisosToggles).filter(
      (key) => permisosToggles[key]
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
      handleCloseForm();

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
    if (!empresaId || !empleadoId) return;

    if (window.confirm("¿Estás seguro de querer desactivar este empleado?")) {
      setLoading(true);
      try {
        await eliminarEmpleado(empresaId, empleadoId);
        fetchEmpleados();
      } catch (error) {
        console.error("Error al eliminar empleado:", error);
        alert("No se pudo eliminar el empleado. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditEmpleado = (empleado) => {
    setSelectedEmpleado(empleado);

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

  const handleCloseForm = () => {
    setShowForm(false);
    setNombre("");
    setTelefono("");
    setContraseña("");
    setConfirmarContraseña("");
    setRol("");
    setSalario(undefined);

    // Resetear todos los toggles de permisos
    const resetToggles = {};
    Object.keys(permisosToggles).forEach((key) => {
      resetToggles[key] = false;
    });
    setPermisosToggles(resetToggles);

    setError("");
    setCurrentTranslate(0);
    setIsAnimating(false);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedEmpleado(null);
    setNombre("");
    setTelefono("");
    setContraseña("");
    setConfirmarContraseña("");
    setRol("");
    setSalario(undefined);
    setEstado("activo");

    setError("");
    setCurrentTranslate(0);
    setIsEditAnimating(false);
  };

  // Filtrar empleados según el término de búsqueda
  const filteredEmpleados = empleados.filter(
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
          onClick={() => setShowForm(true)}
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
                {filteredEmpleados.map((empleado) => (
                  <tr
                    key={empleado.id}
                    className="text-black border-y font-light h-10 border-gray-200"
                  >
                    <td className="pl-4 font-light">
                      {empleado.datos?.nombre || "Sin nombre"}
                    </td>
                    <td className="pl-4 font-light">
                      {empleado.datos?.rol || "Sin rol"}
                    </td>

                    <td className="pl-4 font-light pr-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleEditEmpleado(empleado)}
                          className="cursor-pointer hover:opacity-75 transition-opacity mr-3"
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
          <div className="text-center py-8 text-gray-400">
            {searchTerm
              ? "No se encontraron empleados que coincidan con la búsqueda"
              : "No hay empleados registrados"}
          </div>
        )}
      </div>

      {/* Modal para crear empleado */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
              isAnimating ? "bg-opacity-50" : "bg-opacity-0"
            }`}
            style={{
              opacity: Math.max(0, 1 - currentTranslate / 400),
            }}
            onClick={handleCloseForm}
          />

          <div
            ref={modalRef}
            className={`relative bg-white w-full max-w-4xl rounded-t-lg pb-4 pt-10 transition-transform duration-300 touch-none ${
              isAnimating ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
              transform: `translateY(${currentTranslate}px)`,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-1 bg-gray-200 rounded-full" />
              </div>
            </div>

            <div className="px-4">
              <h2 className="text-2xl font-bold mb-4">Nuevo empleado</h2>

              <input
                type="text"
                placeholder="Nombre y apellido"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 rounded-t-3xl border-x border-t border-black transition-all"
              />

              <input
                type="tel"
                placeholder="Número de teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
              />

              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
              />

              <input
                type="text"
                placeholder="Rol o puesto"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
              />

              <input
                type="number"
                placeholder="Salario (opcional)"
                value={salario || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSalario(value === "" ? undefined : parseInt(value, 10));
                }}
                className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-b rounded-b-3xl border-black transition-all"
              />

              {/* Sección de permisos */}
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">Permisos</h3>
                <div className="bg-gray-100 p-4 rounded-3xl max-h-60 overflow-y-auto">
                  {SYSTEM_FEATURES.map((feature) => (
                    <TogglePermiso
                      key={feature.id}
                      label={feature.title}
                      isOn={permisosToggles[feature.id] || false}
                      onToggle={() => handleTogglePermiso(feature.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="mt-4 mb-4 p-4 border-l-4 border-red-500">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateEmpleado}
                disabled={loading}
                className="w-full bg-black h-20 mt-4 flex flex-col items-center justify-center rounded-3xl"
              >
                {loading ? (
                  <LoadingPoints color="text-gray-100" />
                ) : (
                  <p className="text-gray-100 text-3xl">Crear empleado</p>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar empleado */}
      {showEditForm && selectedEmpleado && (
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
            className={`relative bg-gray-100 w-full max-w-4xl rounded-t-lg pb-4 pt-10 transition-transform duration-300 touch-none ${
              isEditAnimating ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
              transform: `translateY(${currentTranslate}px)`,
              maxHeight: "90vh",
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
              <h2 className="text-2xl text-center font-bold">Editar miembro</h2>
            </div>

            {/* Contenido scrolleable con indicador de scroll */}
            <div className="relative">
              <div
                ref={editContentRef}
                className="px-4 pt-4 overflow-y-auto"
                style={{
                  maxHeight: "calc(90vh - 160px)",
                  paddingBottom: "80px",
                }}
                onScroll={handleEditModalScroll}
              >
                <h3 className="text-lg font-bold mb-2 text-center">Datos</h3>

                <input
                  type="text"
                  placeholder="Nombre y apellido"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 rounded-t-3xl border-x border-t border-black transition-all"
                />

                <input
                  type="tel"
                  placeholder="Número de teléfono (dejar vacío para no cambiar)"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
                />

                <input
                  type="password"
                  placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  className="w-full text-black bg-transparent text-xs border-gray-200 h-10 px-4 border-x border-t border-black transition-all"
                />

                <input
                  type="password"
                  placeholder="Confirmar nueva contraseña"
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

                {/* Mensaje de error */}
                {error && (
                  <div className="mt-4 mb-4 p-4 border-l-4 border-red-500">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Indicador de scroll hacia abajo */}
              {isScrollNeeded && !isNearBottom && (
                <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none ">
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
                onClick={handleUpdateEmpleado}
                disabled={loading}
                className="w-full bg-black h-20 flex flex-col items-center justify-center rounded-3xl"
              >
                {loading ? (
                  <LoadingPoints color="text-gray-100" />
                ) : (
                  <p className="text-gray-100 text-3xl">Actualizar</p>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;
