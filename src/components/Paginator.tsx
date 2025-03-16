import React from "react";

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  className?: string;
}

export const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  // Generar array de números de página para la paginación
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Funciones para la navegación de páginas
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
  };

  // Si solo hay una página, no mostramos el paginador
  if (totalPages <= 1) {
    return null;
  }

  return (
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
          onClick={() => goToPage(number)}
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
  );
};

export default Paginator;
