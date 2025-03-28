import React from "react";
import PropTypes from "prop-types";

const RuletaModal = ({ isOpen, onClose, title, children, winningPrize }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-4">
      <div className="bg-gray-100 flex flex-col items-center justify-center rounded-3xl shadow-xl w-full max-w-md font-coolvetica pb-4 pt-2 relative">
        {title && (
          <h2 className="text-2xl font-bold px-4 text-black pt-2 border-b border-black border-opacity-20 w-full text-center pb-4">
            {title}
          </h2>
        )}
        <div className="w-full px-4 max-h-[80vh] pt-4 overflow-y-auto">
          {children || (
            <div className="flex flex-col items-center ">
              <div className="flex flex-row items-center ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-10 text-green-500"
                >
                  <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 12.75v9h6.75a2.25 2.25 0 0 0 2.25-2.25v-6.75h-9Z" />
                </svg>

                <p className="text-8xl ml-4 font-bold text-center  text-green-500 font-coolvetica">
                  {winningPrize}
                </p>
              </div>
              <p className="text-center font-light text-gray-400 px-4 text-xs font-coolvetica">
                Podes reclamar tu premio mostrando esta pantalla.
              </p>
            </div>
          )}
        </div>

        <div className="w-full px-4 mt-8">
          <button
            onClick={onClose}
            className="w-full h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold cursor-pointer hover:bg-opacity-90 transition-all flex items-center justify-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

RuletaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  winningPrize: PropTypes.string,
};

RuletaModal.defaultProps = {
  title: "¡Felicitaciones!",
  children: null,
  winningPrize: "",
};

export default RuletaModal;
