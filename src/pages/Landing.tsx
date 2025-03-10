import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion"; // Importamos Framer Motion

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
        className="h-20 text-black"
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
    title: "Métricas",
    description:
      "Visualiza el rendimiento de tu negocio en tiempo real. Analiza ventas y comportamiento de clientes para tomar decisiones estratégicas basadas en datos concretos.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-20 text-black"
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
        className="h-20 text-black"
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
        className="h-20 text-black"
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
        className="h-20 text-black"
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
        className="h-20 text-black"
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
        className="h-20 text-black"
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
        className="h-20 text-black"
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
        className="h-20 text-black"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M20.5129 3.4866C18.2882 1.24722 15.2597 -0.00837473 12.1032 4.20445e-05C5.54964 4.20445e-05 0.216056 5.33306 0.213776 11.8883C0.210977 13.9746 0.75841 16.0247 1.80085 17.8319L0.114014 23.9932L6.41672 22.34C8.15975 23.2898 10.1131 23.7874 12.0981 23.7874H12.1032C18.6556 23.7874 23.9897 18.4538 23.992 11.8986C24.0022 8.74248 22.7494 5.71347 20.5129 3.4866ZM17.5234 14.3755C17.2264 14.2267 15.7659 13.5085 15.4934 13.4064C15.2209 13.3044 15.0231 13.2576 14.8253 13.5552C14.6275 13.8528 14.058 14.5215 13.8847 14.7199C13.7114 14.9182 13.5381 14.9427 13.241 14.794C12.944 14.6452 11.9869 14.3316 10.8519 13.3198C9.96884 12.5319 9.36969 11.5594 9.19867 11.2618C9.02765 10.9642 9.18043 10.8057 9.32922 10.6552C9.46261 10.5224 9.62622 10.3086 9.77444 10.1348C9.92266 9.9609 9.97283 9.83776 10.0714 9.63938C10.1701 9.44099 10.121 9.26769 10.0469 9.1189C9.97283 8.97011 9.37824 7.50788 9.13083 6.9133C8.88969 6.3341 8.64513 6.4122 8.46271 6.40023C8.29169 6.39168 8.09102 6.38997 7.89264 6.38997C7.58822 6.39793 7.30097 6.53267 7.10024 6.76166C6.82831 7.05923 6.061 7.77752 6.061 9.23976C6.061 10.702 7.12532 12.1146 7.27354 12.313C7.42176 12.5114 9.36855 15.5117 12.3472 16.7989C12.9004 17.0375 13.4657 17.2468 14.0409 17.426C14.7523 17.654 15.3999 17.6204 15.9118 17.544C16.4819 17.4585 17.6694 16.8251 17.9173 16.1313C18.1653 15.4376 18.1648 14.8424 18.0884 14.7187C18.012 14.595 17.8204 14.5266 17.5234 14.3778V14.3755Z"
          fill="#000000"
        />
      </svg>
    ),
  },
];

const buttonVariants = {
  initial: {
    scale: 1,
    backgroundColor: "#4f46e5", // Color inicial (índigo)
    boxShadow: "0 0 0 0 rgba(99, 102, 241, 0)",
  },
  hover: {
    scale: 1.05,
    backgroundColor: "#6366f1", // Color más claro al hover
    boxShadow: "0 0 0 15px rgba(99, 102, 241, 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    backgroundColor: "#4338ca", // Color más oscuro al hacer clic
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

const floatingButtonVariants = {
  initial: {
    scale: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Índigo con transparencia
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
  },
  hover: {
    scale: 1.05,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export const Landing: React.FC<{
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}> = ({ scrollContainerRef }) => {
  const productsScrollContainerRef = useRef<HTMLDivElement>(null);
  const companiesScrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Función para detectar el scroll del usuario
  const handleUserScroll = (e: Event) => {
    // Obtenemos el elemento que está haciendo scroll
    const container = e.target as HTMLDivElement;
    const currentScrollY = container.scrollTop;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY);

    // Mostrar botón cuando el scroll supere los 50px
    if (currentScrollY > 100) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }

    // Detectar si el usuario ha scrolleado al menos 10px
    if (scrollDifference >= 10) {
      setUserScrolled(true);

      // Actualizar el último scroll conocido
      setLastScrollY(currentScrollY);
    }
  };

  // Useeffect para agregar el listener de scroll
  useEffect(() => {
    // Usar el scrollContainerRef que viene del DashboardMainPage
    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener("scroll", handleUserScroll);

      return () => {
        container.removeEventListener("scroll", handleUserScroll);
      };
    }
  }, [scrollContainerRef]); // Dependencia en scrollContainerRef

  // Función para manejar el desplazamiento automático (se mantiene igual)
  const setupAutoScroll = (containerRef: React.RefObject<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    let scrollAmount = 0;
    const cardWidth = container.scrollWidth / products.length;
    const maxScroll = container.scrollWidth - container.clientWidth;

    const scrollInterval = setInterval(() => {
      scrollAmount += cardWidth;
      if (scrollAmount >= maxScroll) {
        scrollAmount = 0;
      }
      container.scrollTo({
        left: scrollAmount,
        behavior: "smooth",
      });
    }, 2000);

    return () => clearInterval(scrollInterval);
  };

  useEffect(() => {
    return setupAutoScroll(productsScrollContainerRef);
  }, []);

  useEffect(() => {
    return setupAutoScroll(companiesScrollContainerRef);
  }, []);

  return (
    <div className="font-coolvetica pb-32">
      <style>
        {`
			body {
			  overflow-y: hidden;
			}
			.smooth-scroll {
			  scroll-behavior: smooth;
			  scrollbar-width: none;
			  -ms-overflow-style: none;
			}
			.smooth-scroll::-webkit-scrollbar {
			  display: none;
			}
			/* Efectos adicionales para el botón */
			.apple-button {
			  position: relative;
			  overflow: hidden;
			  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			}
			.apple-button::before {
			  content: '';
			  position: absolute;
			  top: 0;
			  left: -100%;
			  width: 100%;
			  height: 100%;
			  background: linear-gradient(
				90deg,
				transparent,
				rgba(255, 255, 255, 0.2),
				transparent
			  );
			  transition: all 0.5s ease;
			}
			.apple-button:hover::before {
			  left: 100%;
			}
		  `}
      </style>

      {/* Título */}
      <div className="py-20 bg-black">
        <p className="text-5xl text-gray-100 text-center mb-4 text-black font-bold">
          Absolute
        </p>
        <motion.div
          className="text-gray-100 text-black mx-8 h-20 flex items-center text-center justify-center text-xl rounded-3xl apple-button cursor-pointer"
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          Prueba gratuita
        </motion.div>
        <p className="text-center text-gray-100 font-light text-xs mt-9 mx-8">
          Soluciones empresariales a través de software. Creamos lo que
          necesites para operar de la mejor manera posible <br /> tu negocio.
        </p>
      </div>

      {/* Resto del componente se mantiene igual */}
      <p className="px-8 text-3xl pb-4 pt-10 text-black font-bold text-center">
        Productos actuales
      </p>
      <div
        ref={productsScrollContainerRef}
        className="px-4 overflow-x-auto smooth-scroll"
      >
        <div className="flex flex-row gap-2">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-gray-200 px-4 min-h-[200px] flex justify-between items-center rounded-3xl shrink-0 w-full"
            >
              <div className="flex flex-col flex-1">
                <p className="text-xl font-medium text-left whitespace-nowrap">
                  {product.title}
                </p>
                <p
                  className="text-xs font-light pr-2"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
                <div className="bg-gray-100 gap-2 text-black rounded-full mt-4 h-10 flex items-center justify-center w-fit px-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 text-indigo-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-medium text-indigo-600">
                    Ver demostración
                  </p>
                </div>
              </div>
              <div className="w-20 flex justify-center">{product.icon}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="px-8 text-center text-xs pt-4 pb-8 text-black">
        Nuestros clientes utilizan estas soluciones en su día a día. Cada
        producto está adaptado a la gestión particular de cada negocio y nacen
        de entender que necesita cada tarea. <br />
        Si te recomendaron Absolute, es porque somos muy buenos en lo que
        hacemos.
      </p>
      {showScrollButton && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-0 right-0 flex justify-center z-50"
        >
          <motion.button
            className="text-indigo-600 px-8 gap-2  h-10 rounded-3xl shadow-lg flex items-center justify-center "
            variants={floatingButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-6"
            >
              <path
                fill-rule="evenodd"
                d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
              />
            </svg>
            Prueba gratuita
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default Landing;
