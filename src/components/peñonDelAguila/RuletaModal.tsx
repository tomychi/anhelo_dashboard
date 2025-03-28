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
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-12 h-12"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-center mb-2 font-coolvetica">
                ¡Ganaste!
              </h2>
              <p className="text-4xl font-bold text-center mb-6 text-green-600 font-coolvetica">
                {winningPrize}
              </p>
              <p className="text-center text-gray-600 px-4 font-coolvetica">
                Puedes reclamar tu premio mostrando esta pantalla en la tienda.
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
