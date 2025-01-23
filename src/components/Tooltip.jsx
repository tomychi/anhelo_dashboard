import React, { useState } from "react";
import PropTypes from "prop-types";

const Tooltip = ({ text, duration = 10000, className = "", position = "right" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  };

  const getPositionClasses = () => {
    // Base classes for the tooltip container
    const baseClasses = `
      absolute z-50 w-96
      top-full right-full mt-2  
      transition-all duration-200 ease-out
    `;

    // Visibility classes
    const visibilityClasses = isVisible
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-2 pointer-events-none";

    return `${baseClasses} ${visibilityClasses}`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Info Icon */}
      <div
        onClick={showTooltip}
        className="cursor-pointer rounded-full transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 text-black"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <div className={getPositionClasses()}>
        <div className="relative bg-black bg-opacity-50 backdrop-blur-sm 
          rounded-2xl shadow-lg border border-gray-200
          overflow-hidden"
        >
          <div className="px-4 py-3">
            {typeof text === 'string' ? (
              <p
                className="text-gray-100 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: text }}
              />
            ) : (
              <div className="text-gray-100 leading-relaxed">
                {text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Tooltip.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  duration: PropTypes.number,
  className: PropTypes.string,
  position: PropTypes.string
};

export default Tooltip;