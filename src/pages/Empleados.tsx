import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import {
  crearEmpleado,
  obtenerEmpleadosDeEmpresa,
  actualizarEmpleado,
  eliminarEmpleado,
  EmpleadoProps,
} from "../firebase/ClientesAbsolute";
import { SYSTEM_FEATURES } from "../utils/permissionsUtils";

const PERMISOS_SISTEMA = SYSTEM_FEATURES.map((feature) => feature.id);

// Componente Toggle reutilizable para permisos
const TogglePermiso = ({ isOn, onToggle, label }) => (
  <div className="flex items-center justify-between w-full py-2 border-b border-gray-200">
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

// Componente para mostrar filas de cargando en la tabla
const TableLoadingRow = () => {
  return (
    <tr className="text-black border font-light h-10 border-black border-opacity-20">
      <td className="w-3/12 pl-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      </td>
      <td className="w-2/12 pl-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
      </td>
      <td className="w-2/12 pl-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
      </td>
      <td className="w-2/12 pl-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
      </td>
      <td className="w-2/12 pl-4 pr-4">
        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-full"></div>
      </td>
    </tr>
  );
};

export const Empleados = () => {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [rol, setRol] = useState("");
  const [salario, setSalario] = useState<number | undefined>(undefined);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [empleados, setEmpleados] = useState<EmpleadoProps[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] =
    useState<EmpleadoProps | null>(null);
  const [estado, setEstado] = useState("activo");

  // Modal drag states
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditAnimating, setIsEditAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);
  const editModalRef = useRef(null);

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

  const fetchEmpleados = async () => {
    setLoading(true);
    try {
      const empleadosData = await obtenerEmpleadosDeEmpresa(empresaId);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      setError("No se pudieron cargar los empleados. Intente nuevamente.");
    } finally {
      setLoading(false);
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
      const datosActualizados: any = {
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

    // Log especial para el teléfono

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

  // Formatear fecha más legible
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Obtener color basado en el estado del empleado
  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "activo":
        return "bg-green-500";
      case "inactivo":
        return "bg-red-main";
      case "suspendido":
        return "bg-yellow-500";
      default:
        return "bg-gray-400 ";
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 pb-8">
        <p className="text-black font-bold text-4xl mt-1">Equipo</p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gray-200 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6"
          >
            <path
              fill-rule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clip-rule="evenodd"
            />
          </svg>

          <p className="font-bold">Nuevo miembro</p>
        </button>
      </div>

      {/* Lista de empleados */}
      <div className="mx-4">
        <table className="w-full text-xs text-left text-black">
          <thead className="text-black border-b h-10">
            <tr>
              <th scope="col" className="pl-4 w-3/12">
                Nombre
              </th>
              <th scope="col" className="pl-4 w-2/12">
                Rol
              </th>
              <th scope="col" className="pl-4 w-2/12">
                Estado
              </th>
              <th scope="col" className="pl-4 w-2/12">
                Último acceso
              </th>
              <th scope="col" className="w-2/12">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableLoadingRow key={index} />
              ))
            ) : empleados.length > 0 ? (
              empleados.map((empleado, index) => (
                <tr
                  key={index}
                  className="text-black border font-light h-10 border-black border-opacity-20"
                >
                  <td className="w-3/12 font-light pl-4">
                    {empleado.datos?.nombre || "Sin nombre"}
                  </td>
                  <td className="w-2/12 pl-4 font-light">
                    {empleado.datos?.rol || "Sin rol"}
                  </td>
                  <td className="w-2/12 pl-4 font-light">
                    <div className="flex flex-row items-center gap-2">
                      <p
                        className={`flex flex-row rounded-full h-6 px-2 items-center text-gray-100 font-bold ${getEstadoColor(empleado.datos?.estado)}`}
                      >
                        {empleado.datos?.estado || "Desconocido"}
                      </p>
                    </div>
                  </td>
                  <td className="w-2/12 pl-4 font-light">
                    {formatearFecha(empleado.datos?.ultimoAcceso) || "-"}
                  </td>
                  <td className="w-2/12 pl-4 pr-4 flex justify-end">
                    <button
                      className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 mr-2"
                      onClick={() => handleEditEmpleado(empleado)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4"
                      >
                        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                      </svg>
                    </button>
                    <button
                      className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200"
                      onClick={() => handleDeleteEmpleado(empleado.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 text-red-main"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 bg-gray-100 rounded-lg"
                >
                  <p className="text-gray-400 ">No hay empleados registrados</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación simple */}
        {empleados.length > 0 && (
          <div className="flex justify-center items-center gap-8 pt-8 pb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 transform rotate-180"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-bold font-coolvetica text-xs">1</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

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
            className={`relative bg-white w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-10 transition-transform duration-300 touch-none ${
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

            <div className="mt-4 flex-col space-y-2 w-full">
              <h2 className="text-2xl font-bold mb-4">Nuevo empleado</h2>

              <input
                type="text"
                placeholder="Nombre y apellido"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="tel"
                placeholder="Número de teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="text"
                placeholder="Rol o puesto"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="number"
                placeholder="Salario (opcional)"
                value={salario || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSalario(value === "" ? undefined : parseInt(value, 10));
                }}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              {/* Sección de permisos */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Permisos</h3>
                <div className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
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
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                  <p className="text-red-500 text-xs">{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateEmpleado}
              disabled={loading}
              className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-lg outline-none"
            >
              {loading ? (
                <div className="flex justify-center w-full items-center">
                  <div className="flex flex-row gap-1">
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              ) : (
                "Crear empleado"
              )}
            </button>
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
            className={`relative bg-white w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-10 transition-transform duration-300 touch-none ${
              isEditAnimating ? "translate-y-0" : "translate-y-full"
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

            <div className="mt-4 flex-col space-y-2 w-full">
              <h2 className="text-2xl font-bold mb-4">Editar empleado</h2>

              <input
                type="text"
                placeholder="Nombre y apellido"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="tel"
                placeholder="Número de teléfono (dejar vacío para no cambiar)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="password"
                placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="text"
                placeholder="Rol o puesto"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              <input
                type="number"
                placeholder="Salario"
                value={salario || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSalario(value === "" ? undefined : parseInt(value, 10));
                }}
                className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
              />

              {/* Selector de estado */}
              <div className="w-full">
                <label className="block text-xs mb-1">
                  Estado del empleado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>

              {/* Sección de permisos */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Permisos</h3>
                <div className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {SYSTEM_FEATURES.map((feature) => (
                    <TogglePermiso
                      key={feature.id}
                      label={feature.title}
                      isOn={editPermisosToggles[feature.id] || false}
                      onToggle={() => handleToggleEditPermiso(feature.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                  <p className="text-red-500 text-xs">{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpdateEmpleado}
              disabled={loading}
              className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-lg outline-none"
            >
              {loading ? (
                <div className="flex justify-center w-full items-center">
                  <div className="flex flex-row gap-1">
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              ) : (
                "Actualizar empleado"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;
