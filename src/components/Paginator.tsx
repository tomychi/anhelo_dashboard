import React from "react";

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

  // Funciones para la navegación de páginas
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
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
      <div className={`flex justify-center items-center my-4 ${className}`}>
        <style>
          {`
            .pagination-button {
              background-color: #f3f4f6;
              border: 2px solid black;
              border-radius: 9999px;
              padding: 0.25rem 0.75rem;
              margin: 0 0.25rem;
              cursor: pointer;
              font-weight: bold;
            }
            .pagination-button.active {
              background-color: black;
              color: white;
            }
            .pagination-button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          `}
        </style>
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="pagination-button"
          aria-label="Página anterior"
        >
          &lt;
        </button>

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`pagination-button ${
              currentPage === number ? "active" : ""
            }`}
            aria-label={`Ir a página ${number}`}
            aria-current={currentPage === number ? "page" : undefined}
          >
            {number}
          </button>
        ))}

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="pagination-button"
          aria-label="Página siguiente"
        >
          &gt;
        </button>
      </div>
    </>
  );
};

export default Paginator;
