import React from "react";
import arrowIcon from "../assets/arrowIcon.png";

interface PaginatorProps<T> {
  items: T[];
  itemsPerPage: number;
  renderItems: (paginatedItems: T[]) => React.ReactNode;
  currentPage?: number;
  onPageChange?: (pageNumber: number) => void;
  className?: string;
}

export const Paginator = <T extends unknown>({
  items,
  itemsPerPage,
  renderItems,
  currentPage: externalCurrentPage,
  onPageChange,
  className = "",
}: PaginatorProps<T>) => {
  // Estado interno para la página actual si no se proporciona externamente
  const [internalCurrentPage, setInternalCurrentPage] = React.useState(1);

  // Determinar si usamos estado interno o externo
  const currentPage = externalCurrentPage ?? internalCurrentPage;

  // Función para cambiar de página
  const handlePageChange = (pageNumber: number) => {
    if (onPageChange) {
      onPageChange(pageNumber);
    } else {
      setInternalCurrentPage(pageNumber);
    }
  };

  // Calcular el número total de páginas
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Calcular los índices para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Obtener los elementos para la página actual
  const paginatedItems = items.slice(indexOfFirstItem, indexOfLastItem);

  // Generar array de números de página para la paginación
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Determinar si los botones están deshabilitados
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  // Funciones para la navegación de páginas
  const goToNextPage = () => {
    if (!isNextDisabled) {
      handlePageChange(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (!isPrevDisabled) {
      handlePageChange(currentPage - 1);
    }
  };

  // Renderizar el contenido proporcionado por renderItems
  const content = renderItems(paginatedItems);

  // Si solo hay una página, renderizar el contenido sin controles de paginación
  if (totalPages <= 1) {
    return <>{content}</>;
  }

  return (
    <>
      {content}
      <div
        className={`flex justify-center font-coolvetica flex-row gap-4 items-center mt-2 ${className}`}
      >
        <img
          onClick={goToPreviousPage}
          src={arrowIcon}
          className={`h-2 transform rotate-180 cursor-pointer ${isPrevDisabled ? "opacity-50" : ""}`}
          style={{ opacity: isPrevDisabled ? 0.5 : 1 }}
          alt="Página anterior"
        />

        {currentPage}

        <img
          onClick={goToNextPage}
          src={arrowIcon}
          className={`h-2 cursor-pointer ${isNextDisabled ? "opacity-50" : ""}`}
          style={{ opacity: isNextDisabled ? 0.5 : 1 }}
          alt="Página siguiente"
        />
      </div>
    </>
  );
};

export default Paginator;
