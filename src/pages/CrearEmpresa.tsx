import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearEmpresa,
  verificarTelefonoExistente,
} from "../firebase/ClientesAbsolute";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/auth/authAction";
import LoadingPoints from "../components/LoadingPoints";
import arrowIcon from "../assets/arrowIcon.png";

const products = [
  {
    title: "Facturación automática",
    description:
      "Ahorra horas de trabajo con facturas generadas al instante tras cada venta. Sistema personalizable que reduce errores y garantiza cumplimiento fiscal.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path
          fillRule="evenodd"
          d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375ZM6 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V12Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 15a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V15Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 18a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V18Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Dashboard",
    description:
      "Visualiza el rendimiento de tu negocio en tiempo real. Analiza ventas y comportamiento de clientes para tomar decisiones estratégicas basadas en datos concretos.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path
          fillRule="evenodd"
          d="M2.25 2.25a.75.75 0 0 0 0 1.5H3v10.5a3 3 0 0 0 3 3h1.21l-1.172 3.513a.75.75 0 0 0 1.424.474l.329-.987h8.418l.33.987a.75.75 0 0 0 1.422-.474l-1.17-3.513H18a3 3 0 0 0 3-3V3.75h.75a.75.75 0 0 0 0-1.5H2.25Zm6.54 15h6.42l.5 1.5H8.29l.5-1.5Zm8.085-8.995a.75.75 0 1 0-.75-1.299 12.81 12.81 0 0 0-3.558 3.05L11.03 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l2.47-2.47 1.617 1.618a.75.75 0 0 0 1.146-.102 11.312 11.312 0 0 1 3.612-3.321Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Operaciones",
    description:
      "Optimizamos tus procesos clave para maximizar eficiencia y reducir costos. Automatizamos cada paso para que puedas enfocarte en hacer crecer tu negocio.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path
          fillRule="evenodd"
          d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Empleados",
    description:
      "Gestiona asistencia, tareas y nóminas en una sola plataforma. Aumenta la productividad mientras reduces la carga administrativa de tu equipo de recursos humanos.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path
          fillRule="evenodd"
          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Inversores",
    description:
      "Gestión profesional para captar capital y optimizar relaciones con inversores. Acelera el crecimiento de tu negocio con las estrategias financieras adecuadas.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path
          fillRule="evenodd"
          d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l3.97-3.97h-2.69a.75.75 0 0 1-.75-.75Zm-12 0A.75.75 0 0 1 3.75 3h4.5a.75.75 0 0 1 0 1.5H5.56l3.97 3.97a.75.75 0 0 1-1.06 1.06L4.5 5.56v2.69a.75.75 0 0 1-1.5 0v-4.5Zm11.47 11.78a.75.75 0 1 1 1.06-1.06l3.97 3.97v-2.69a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1 0-1.5h2.69l-3.97-3.97Zm-4.94-1.06a.75.75 0 0 1 0 1.06L5.56 19.5h2.69a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 1.5 0v2.69l3.97-3.97a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Finanzas",
    description:
      "Conoce la rentabilidad exacta de cada producto. Calcula automáticamente márgenes y estructura de costos para tomar decisiones financieras informadas.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
        <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
        <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
        <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
      </svg>
    ),
  },
  {
    title: "Página de ventas",
    description:
      "Multiplica tus ventas con una tienda online integrada a nuestro sistema. Recibe pedidos 24/7 y ofrece una experiencia de compra excepcional.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
        <path
          fillRule="evenodd"
          d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Precios dinámicos",
    description:
      "Incrementa ingresos ajustando precios según demanda e inventario. Nuestra IA sugiere el precio óptimo equilibrando volumen de ventas y margen de beneficio.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 px-2"
      >
        <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
        <path
          fillRule="evenodd"
          d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
          clipRule="evenodd"
        />
        <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
      </svg>
    ),
  },
  {
    title: "WhatsApp Marketing",
    description:
      "Reconecta con clientes inactivos mediante campañas personalizadas de alto impacto. Segmenta audiencias y envía ofertas con la mayor tasa de conversión.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 px-2 "
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M20.5129 3.4866C18.2882 1.24722 15.2597 -0.00837473 12.1032 4.20445e-05C5.54964 4.20445e-05 0.216056 5.33306 0.213776 11.8883C0.210977 13.9746 0.75841 16.0247 1.80085 17.8319L0.114014 23.9932L6.41672 22.34C8.15975 23.2898 10.1131 23.7874 12.0981 23.7874H12.1032C18.6556 23.7874 23.9897 18.4538 23.992 11.8986C24.0022 8.74248 22.7494 5.71347 20.5129 3.4866ZM17.5234 14.3755C17.2264 14.2267 15.7659 13.5085 15.4934 13.4064C15.2209 13.3044 15.0231 13.2576 14.8253 13.5552C14.6275 13.8528 14.058 14.5215 13.8847 14.7199C13.7114 14.9182 13.5381 14.9427 13.241 14.794C12.944 14.6452 11.9869 14.3316 10.8519 13.3198C9.96884 12.5319 9.36969 11.5594 9.19867 11.2618C9.02765 10.9642 9.18043 10.8057 9.32922 10.6552C9.46261 10.5224 9.62622 10.3086 9.77444 10.1348C9.92266 9.9609 9.97283 9.83776 10.0714 9.63938C10.1701 9.44099 10.121 9.26769 10.0469 9.1189C9.97283 8.97011 9.37824 7.50788 9.13083 6.9133C8.88969 6.3341 8.64513 6.4122 8.46271 6.40023C8.29169 6.39168 8.09102 6.38997 7.89264 6.38997C7.58822 6.39793 7.30097 6.53267 7.10024 6.76166C6.82831 7.05923 6.061 7.77752 6.061 9.23976C6.061 10.702 7.12532 12.1146 7.27354 12.313C7.42176 12.5114 9.36855 15.5117 12.3472 16.7989C12.9004 17.0375 13.4657 17.2468 14.0409 17.426C14.7523 17.654 15.3999 17.6204 15.9118 17.544C16.4819 17.4585 17.6694 16.8251 17.9173 16.1313C18.1653 15.4376 18.1648 14.8424 18.0884 14.7187C18.012 14.595 17.8204 14.5266 17.5234 14.3778V14.3755Z"
        />
      </svg>
    ),
  },
];

export const CrearEmpresa: React.FC<{}> = () => {
  // Estado para controlar los pasos (1: telefono, 2: datos empresa, 3: features)
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Estados para los campos del formulario
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [rolUsuario, setRolUsuario] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cantidadEmpleados, setCantidadEmpleados] = useState("");
  const [formaJuridica, setFormaJuridica] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState(["Dashboard"]);
  const [isEmpleadosOpen, setIsEmpleadosOpen] = useState(false);
  const [isFormaJuridicaOpen, setIsFormaJuridicaOpen] = useState(false);

  // Estado para errores
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Features disponibles
  const features = [
    {
      id: "feature_dashboard",
      name: "Dashboard",
      description: "Visualiza todas tus métricas en un solo lugar",
    },
    {
      id: "feature_empleados",
      name: "Gestión de empleados",
      description: "Administra la información de tu equipo",
    },
    {
      id: "feature_ventas",
      name: "Registro de ventas",
      description: "Controla tus ingresos y transacciones",
    },
    {
      id: "feature_inventario",
      name: "Control de inventario",
      description: "Maneja tu stock y productos",
    },
    {
      id: "feature_finanzas",
      name: "Finanzas",
      description: "Administra tus gastos e ingresos",
    },
    {
      id: "feature_reportes",
      name: "Reportes",
      description: "Análisis detallado de tu negocio",
    },
  ];

  const toggleFeature = (productTitle) => {
    // Si intenta deseleccionar Dashboard, mostrar notificación y no hacer nada
    if (
      productTitle === "Dashboard" &&
      selectedFeatures.includes(productTitle)
    ) {
      // Crear notificación temporal
      const notification = document.createElement("div");
      notification.style.position = "fixed";
      notification.style.bottom = "20px";
      notification.style.padding = "0 20px";
      notification.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      notification.style.color = "white";
      notification.style.borderRadius = "9999px";
      notification.style.marginRight = "1rem";
      notification.style.paddingLeft = "1rem"; // px-4 (16px) de padding horizontal
      notification.style.paddingRight = "1rem"; // px-4 (16px) de padding horizontal
      notification.style.height = "40px";
      notification.style.zIndex = "1000";
      notification.style.transform = "translateX(-50%)";
      notification.style.left = "50%";
      notification.style.textAlign = "center";
      notification.style.fontFamily = "Coolvetica, sans-serif";
      notification.style.fontWeight = "300"; //font light
      notification.style.backdropFilter = "blur(8px)";
      notification.style.WebkitBackdropFilter = "blur(8px)";
      notification.style.whiteSpace = "nowrap"; // Asegura una sola línea
      notification.style.display = "flex";
      notification.style.fontSize = "13px"; //text xs
      notification.style.alignItems = "center";
      notification.style.justifyContent = "center";
      notification.style.gap = "8px";

      // Crear el SVG (usando un ícono de información)
      const svgIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svgIcon.setAttribute("viewBox", "0 0 24 24");
      svgIcon.setAttribute("fill", "currentColor");
      svgIcon.style.width = "24px";
      svgIcon.style.height = "24px";
      svgIcon.style.flexShrink = "0";

      // Crear el path dentro del SVG (un ícono de información)
      const svgPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      svgPath.setAttribute("fill-rule", "evenodd");
      svgPath.setAttribute("clip-rule", "evenodd");
      svgPath.setAttribute(
        "d",
        "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
      );

      // Añadir el path al SVG
      svgIcon.appendChild(svgPath);

      // Crear un span para el texto
      const textSpan = document.createElement("span");
      textSpan.textContent = "Esta opción no se puede deseleccionar";
      textSpan.style.fontWeight = "light"; // Asegurando que el texto tenga font-light

      // Añadir el SVG y el texto a la notificación
      notification.appendChild(svgIcon);
      notification.appendChild(textSpan);

      document.body.appendChild(notification);

      // Desaparecer la notificación después de 2 segundos
      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 2000);

      return; // Salir de la función sin modificar selectedFeatures
    }

    // Comportamiento normal para otras funcionalidades
    if (selectedFeatures.includes(productTitle)) {
      setSelectedFeatures(
        selectedFeatures.filter((title) => title !== productTitle)
      );
    } else {
      setSelectedFeatures([...selectedFeatures, productTitle]);
    }
  };

  const handleContinue = async () => {
    // Validar campos
    if (!telefono || !contraseña || !confirmarContraseña) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError("");

    // Verificar si el teléfono ya existe
    try {
      const existeTelefono = await verificarTelefonoExistente(telefono);
      if (existeTelefono) {
        setError("Este número de teléfono ya está registrado.");
        setLoading(false);
        return;
      }

      // Todo bien, continuar al siguiente paso
      setCurrentStep(2);
      setLoading(false);
    } catch (error) {
      console.error("Error al verificar teléfono:", error);
      setError("Error al verificar datos. Intenta nuevamente.");
      setLoading(false);
    }
  };

  const handleNextToDatosEmpresa = async () => {
    // Validar campos
    if (
      !nombreEmpresa ||
      !nombreUsuario ||
      !cantidadEmpleados ||
      !formaJuridica ||
      !rolUsuario
    ) {
      setError("Por favor, completa todos los datos de la empresa");
      return;
    }

    setError("");
    // Avanzar al tercer paso
    setCurrentStep(3);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleStart = async () => {
    // Verificar que se haya seleccionado al menos un feature
    if (selectedFeatures.length === 0) {
      setError("Por favor, selecciona al menos un feature");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Crear la empresa en Firebase
      const empresaId = await crearEmpresa(
        nombreUsuario,
        telefono,
        contraseña,
        nombreEmpresa,
        cantidadEmpleados,
        formaJuridica,
        rolUsuario,
        selectedFeatures // Agregar los features seleccionados
      );

      console.log("Empresa creada con ID:", empresaId);

      // Crear objeto de empresa para el login
      const empresaData = {
        id: empresaId,
        datosGenerales: {
          nombre: nombreEmpresa,
          cantidadEmpleados: cantidadEmpleados,
          formaJuridica: formaJuridica,
          fechaCreacion: new Date(),
        },
        datosUsuario: {
          nombreUsuario: nombreUsuario,
          telefono: telefono,
          contraseña: contraseña,
          rolUsuario: rolUsuario,
        },
        features: selectedFeatures,
        featuresIniciales: selectedFeatures, // Añadimos la nueva propiedad
        estado: "activo",
        ultimaActualizacion: new Date(),
      };

      // Iniciar sesión automáticamente
      dispatch(loginSuccess(empresaData, "empresa"));

      // Redirigir a la página principal
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al crear empresa:", error);
      setError("Error al crear la empresa. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="font-coolvetica pt-6">
      {/* Add animation styles */}
      <style>
        {`
          @keyframes loadingBar {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: 200px 0;
            }
          }

          .animated-loading {
            background: linear-gradient(
              to right,
              #000 0%,
              #000 40%,
              #555 100%,
              #000 60%,
              #000 100%
            );
            background-size: 400% 100%;
            animation: loadingBar 5s linear infinite;
          }
        `}
      </style>

      {currentStep === 1 && (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-center">
            {/* First bar animated, others static */}
            <div className="w-1/6 h-2 rounded-full animated-loading"></div>
            <div className="w-1/6 border-gray-300 border h-2 rounded-full"></div>
            <div className="w-1/6 border-gray-300 border h-2 rounded-full"></div>
          </div>
          <h2 className="text-3xl mx-4 mt-2 text-center">Registrate</h2>

          <div className="mx-4 pt-14 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Tu numero de telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="password"
              placeholder="Una contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="password"
              placeholder="Repeti la contraseña"
              value={confirmarContraseña}
              onChange={(e) => setConfirmarContraseña(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
          </div>

          <div
            className={`text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 ${loading ? "opacity-70" : "cursor-pointer"}`}
            onClick={!loading ? handleContinue : undefined}
          >
            {loading ? <LoadingPoints color="text-gray-100" /> : "Continuar"}
          </div>
          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className=" mt-4 h-10 px-4 items-center text-xs text-red-main border-l-4 flex  border-red-main mx-4 ">
              {error}
            </div>
          )}
        </>
      )}

      {currentStep === 2 && (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-center">
            {/* Second bar animated, first complete, third static */}
            <div className="w-1/6 h-2 rounded-full bg-black"></div>
            <div className="w-1/6 h-2 rounded-full animated-loading"></div>
            <div className="w-1/6 border-gray-300 border h-2 rounded-full"></div>
          </div>
          <h2 className="text-3xl mx-4 mt-2 text-center">
            Introduci los datos de tu empresa
          </h2>
          <div
            className="text-gray-400 mt-2   flex-row gap-1 text-xs justify-center flex items-center font-light  cursor-pointer"
            onClick={handlePrevious}
          >
            <img
              src={arrowIcon}
              className="transform rotate-180 h-2 opacity-30"
            />
            Volver
          </div>
          <div className="mx-4 pt-14 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Nombre de la empresa o razon social"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <div className="relative">
              <select
                value={cantidadEmpleados}
                onChange={(e) => setCantidadEmpleados(e.target.value)}
                onFocus={() => setIsEmpleadosOpen(true)}
                onBlur={() => setIsEmpleadosOpen(false)}
                className={`w-full h-10 px-4 text-xs font-light bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0 ${cantidadEmpleados === "" ? "text-opacity-50 text-gray-500" : "text-black"}`}
                required
              >
                <option value="" disabled>
                  Selecciona cantidad de empleados
                </option>
                <option value="1-9">1-9 empleados</option>
                <option value="10-29">10-29 empleados</option>
                <option value="30-49">30-49 empleados</option>
                <option value="50-99">50-99 empleados</option>
                <option value="100-199">100-199 empleados</option>
                <option value="200+">200+ empleados</option>
              </select>
              <div className="pointer-events-none absolute z-50 inset-y-0 right-4 flex items-center  text-black">
                <img
                  src={arrowIcon}
                  className={`transform h-2 ${isEmpleadosOpen ? "-rotate-90" : "rotate-90"} transition-transform duration-300`}
                  alt=""
                />
              </div>
            </div>
            <div className="relative">
              <select
                value={formaJuridica}
                onChange={(e) => setFormaJuridica(e.target.value)}
                onFocus={() => setIsFormaJuridicaOpen(true)}
                onBlur={() => setIsFormaJuridicaOpen(false)}
                className={`w-full h-10 px-4 text-xs font-light bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0 ${formaJuridica === "" ? "text-opacity-50 text-gray-500" : "text-black"}`}
                required
              >
                <option value="" disabled>
                  Selecciona forma jurídica
                </option>
                <option value="SAS">
                  Sociedad por Acciones Simplificada (SAS)
                </option>
                <option value="SRL">
                  Sociedad de Responsabilidad Limitada (SRL)
                </option>
                <option value="SA">Sociedad Anónima (SA)</option>
                <option value="Monotributista">Monotributista</option>
                <option value="Autónomo">Autónomo</option>
                <option value="Sociedad de Hecho">Sociedad de Hecho</option>
                <option value="Sociedad Colectiva">Sociedad Colectiva</option>
                <option value="Otros">Otros</option>
              </select>
              <div className="pointer-events-none absolute z-50 inset-y-0 right-4 flex items-center  text-black">
                <img
                  src={arrowIcon}
                  className={`transform h-2 ${isFormaJuridicaOpen ? "-rotate-90" : "rotate-90"} transition-transform duration-300`}
                  alt=""
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="text"
              placeholder="Tu rol"
              value={rolUsuario}
              onChange={(e) => setRolUsuario(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-lg appearance-none focus:outline-none focus:ring-0"
            />
          </div>

          <div
            className={`text-gray-100 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 ${loading ? "opacity-70" : "cursor-pointer"}`}
            onClick={!loading ? handleNextToDatosEmpresa : undefined}
          >
            {loading ? <LoadingPoints color="text-gray-100" /> : "Continuar"}
          </div>

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className=" mt-4 h-10 px-4 items-center text-red-main border-l-4 flex text-xs border-red-main mx-4 ">
              {error}
            </div>
          )}
        </>
      )}

      {currentStep === 3 && (
        <>
          <div className="flex flex-row mx-4 gap-2 justify-center">
            {/* First two bars complete, third animated */}
            <div className="w-1/6 h-2 rounded-full bg-black"></div>
            <div className="w-1/6 h-2 rounded-full bg-black"></div>
            <div className="w-1/6 h-2 rounded-full animated-loading"></div>
          </div>

          <h2 className="text-3xl mx-4 mt-2 text-center">
            Selecciona los features que vas a utilizar
          </h2>
          <div
            className="text-gray-400 mt-2   flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
            onClick={handlePrevious}
          >
            <img
              src={arrowIcon}
              className="transform rotate-180 h-2 opacity-30"
            />
            Volver
          </div>

          <div className="mx-4 pt-14 flex flex-col gap-2">
            {products.map((product) => (
              <div
                key={product.title}
                onClick={() => toggleFeature(product.title)}
                className={`w-full p-4 h-30 rounded-3xl border border-gray-200 items-center flex flex-row gap-4 cursor-pointer transition-colors ${
                  selectedFeatures.includes(product.title)
                    ? "bg-black text-gray-100"
                    : "bg-gray-100"
                }`}
              >
                {/* Izquierda - Mostrando el SVG del producto */}
                <div
                  className={`${
                    selectedFeatures.includes(product.title)
                      ? "text-gray-100"
                      : "text-black"
                  }`}
                >
                  {product.icon}
                </div>

                {/* Derecha */}
                <div className="flex flex-col">
                  <h3 className="font-medium text-lg">{product.title}</h3>
                  <p
                    className={`text-xs font-light ${
                      selectedFeatures.includes(product.title)
                        ? "text-gray-200"
                        : "text-gray-400"
                    }`}
                  >
                    {product.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`text-gray-100 mb-8 bg-black mx-4 h-20 rounded-3xl text-3xl justify-center flex items-center mt-4 ${loading ? "opacity-70" : "cursor-pointer"}`}
            onClick={!loading ? handleStart : undefined}
          >
            {loading ? <LoadingPoints color="text-gray-100" /> : "Comenzar"}
          </div>

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className="mt-4 h-10 px-4 items-center text-xs text-red-main border-l-4 flex border-red-main mx-4">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CrearEmpresa;
