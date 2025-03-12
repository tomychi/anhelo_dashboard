import React, { useEffect, useState } from "react";
import arrowIcon from "../../assets/arrowIcon.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tiempoMaximoRecorrido: number | null;
  setTiempoMaximoRecorrido: (tiempo: number | null) => void;
  showComandas: boolean;
  setShowComandas: (show: boolean) => void;
  velocidadPromedio: number | null;
  handleCadeteVelocidadChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  cadetesDisponibles: any[];
  calcularVelocidadPromedio: (cadete: any) => number;
  onlyElaborated: boolean;
  setOnlyElaborated: (value: boolean) => void;
  hideAssignedGroups: boolean;
  setHideAssignedGroups: (value: boolean) => void;
  selectedDelay: number;
  setSelectedDelay: (delay: number) => void;
  handleActivateHighDemand: () => void;
  handleDeactivateHighDemand: () => void;
  altaDemanda: any;
  remainingMinutes: number | null;
  isCreateCadetModalOpen: boolean;
  setIsCreateCadetModalOpen: (isOpen: boolean) => void;
  altaDemandaMessage: string;
  setAltaDemandaMessage: (message: string) => void;
  handleMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearMessage: () => void;
}

const Toggle: React.FC<{ isOn: boolean; onToggle: () => void }> = ({
  isOn,
  onToggle,
}) => (
  <div
    className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer ${
      isOn ? "bg-black" : "bg-gray-200"
    }`}
    onClick={onToggle}
  >
    <div
      className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
        isOn ? "translate-x-6" : ""
      }`}
    />
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  tiempoMaximoRecorrido,
  setTiempoMaximoRecorrido,
  showComandas,
  setShowComandas,
  velocidadPromedio,
  handleCadeteVelocidadChange,
  cadetesDisponibles,
  calcularVelocidadPromedio,
  onlyElaborated,
  hideAssignedGroups,
  setHideAssignedGroups,
  setOnlyElaborated,
  selectedDelay,
  setSelectedDelay,
  handleActivateHighDemand,
  handleDeactivateHighDemand,
  altaDemanda,
  remainingMinutes,
  isCreateCadetModalOpen,
  setIsCreateCadetModalOpen,
  altaDemandaMessage,
  setAltaDemandaMessage,
  handleMessageChange,
  handleClearMessage,
}) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed right-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-4 border-b">
          <h2 className="text-2xl text-center font-bold">Herramientas</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Action Buttons Section */}
          <div className="mb-6 space-y-2">
            {/* Alta Demanda Message Input */}
            <div className="relative flex items-center flex-col gap-2 mb-4">
              <div className="relative flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="text"
                  value={altaDemandaMessage}
                  onChange={(e) => setAltaDemandaMessage(e.target.value)}
                  placeholder="Mensaje de alta demanda..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200  rounded-full focus:outline-none focus:ring-2 focus:ring-red-main focus:border-transparent"
                />
              </div>
              <button
                onClick={() =>
                  handleMessageChange({
                    target: { value: altaDemandaMessage },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                Enviar
              </button>
              <button
                onClick={handleClearMessage}
                className="bg-red-main text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                Borrar
              </button>
            </div>

            <button
              onClick={() => setIsCreateCadetModalOpen(true)}
              className="bg-black font-coolvetica text-gray-100 px-6 h-10 rounded-full font-bold w-full"
            >
              Cadete
            </button>

            <div className="relative w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 absolute left-2 top-1/2 -translate-y-1/2"
                style={selectedDelay === 0 ? {} : { filter: "invert(100%)" }}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                />
              </svg>
              <select
                value={selectedDelay}
                onChange={(e) => setSelectedDelay(Number(e.target.value))}
                className={`h-10 pl-9 pb-0.5 font-bold rounded-full w-full ${
                  selectedDelay === 0
                    ? "bg-gray-200 text-black"
                    : "bg-black text-gray-100"
                }`}
              >
                <option value={0}>Minutos de demora</option>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>

            {!altaDemanda?.isHighDemand && (
              <button
                onClick={handleActivateHighDemand}
                disabled={selectedDelay === 0}
                className={`px-4 w-full flex flex-row items-center gap-1 h-10 rounded-full font-medium ${
                  selectedDelay === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6"
                >
                  <path d="M15 6.75a.75.75 0 0 0-.75.75V18a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75H15ZM20.25 6.75a.75.75 0 0 0-.75.75V18c0 .414.336.75.75.75H21a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-.75ZM5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L5.055 7.061Z" />
                </svg>
                <p className="font-bold">Pausar</p>
              </button>
            )}
            {altaDemanda?.isHighDemand &&
              remainingMinutes &&
              remainingMinutes > 0 && (
                <>
                  <button
                    onClick={handleDeactivateHighDemand}
                    className="bg-red-main gap-2 text-gray-100 flex items-center w-full pl-4 h-10 font-bold rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6"
                    >
                      <path d="M15 6.75a.75.75 0 0 0-.75.75V18a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75H15ZM20.25 6.75a.75.75 0 0 0-.75.75V18c0 .414.336.75.75.75H21a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-.75ZM5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L5.055 7.061Z" />
                    </svg>
                    Retomar
                  </button>

                  <div className="flex items-center gap-2 w-full bg-red-100 px-4 h-10 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-500 font-bold">
                      {remainingMinutes}{" "}
                      {remainingMinutes === 1 ? "minuto" : "minutos"} restantes
                    </span>
                  </div>
                </>
              )}
          </div>

          {/* Existing Configuration Options */}
          <div className="mb-4">
            <p className="font-bold mb-2 text-sm">Recorrido</p>
            <div className="relative inline-block mb-2 w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 absolute left-3 top-1/2 -translate-y-1/2"
                style={
                  tiempoMaximoRecorrido === null
                    ? {}
                    : { filter: "invert(100%)" }
                }
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                  clipRule="evenodd"
                />
              </svg>
              <select
                value={tiempoMaximoRecorrido || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setTiempoMaximoRecorrido(value);
                }}
                className={`h-10 appearance-none text-sm pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full w-full ${
                  tiempoMaximoRecorrido === null
                    ? "bg-gray-200 text-black"
                    : "bg-black text-gray-100"
                }`}
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="">¿Minutos máximos?</option>
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((tiempo) => (
                  <option key={tiempo} value={tiempo}>
                    {tiempo} minutos
                  </option>
                ))}
              </select>
              <img
                src={arrowIcon}
                alt="Arrow Icon"
                className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
                style={
                  tiempoMaximoRecorrido === null
                    ? {}
                    : { filter: "invert(100%)" }
                }
              />
            </div>

            <div className="relative inline-block w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 absolute left-3 top-1/2 -translate-y-1/2"
                style={
                  velocidadPromedio === null ? {} : { filter: "invert(100%)" }
                }
              >
                <path
                  fillRule="evenodd"
                  d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                  clipRule="evenodd"
                />
              </svg>
              <select
                onChange={handleCadeteVelocidadChange}
                className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full w-full text-sm ${
                  velocidadPromedio === null
                    ? "bg-gray-200 text-black"
                    : "bg-black text-gray-100"
                }`}
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="">¿Velocidad promedio?</option>
                {cadetesDisponibles
                  .filter((cadete) => cadete.name !== "NO ASIGNADO")
                  .map((cadete) => {
                    const cadeteNameFormatted =
                      cadete.name.charAt(0).toUpperCase() +
                      cadete.name.slice(1).toLowerCase();
                    return (
                      <option
                        key={`${cadete.name}-${cadete.id}-filter`}
                        value={cadete.name}
                      >
                        {cadeteNameFormatted}:{" "}
                        {calcularVelocidadPromedio(cadete)} km/h
                      </option>
                    );
                  })}
              </select>
              <img
                src={arrowIcon}
                alt="Arrow Icon"
                className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
                style={
                  velocidadPromedio === null ? {} : { filter: "invert(100%)" }
                }
              />
            </div>
          </div>

          <div className="mb-4 mt-10 space-y-2">
            <div className="flex flex-row items-center justify-between gap-2">
              <p className="font-bold text-sm">Solo pedidos cocinados</p>
              <div className="flex items-center justify-between">
                <Toggle
                  isOn={onlyElaborated}
                  onToggle={() => setOnlyElaborated(!onlyElaborated)}
                />
              </div>
            </div>
            <div className="flex flex-row items-center justify-between gap-2">
              <p className="font-bold text-sm">Ocultar grupos asignados</p>
              <div className="flex items-center justify-between">
                <Toggle
                  isOn={hideAssignedGroups}
                  onToggle={() => setHideAssignedGroups(!hideAssignedGroups)}
                />
              </div>
            </div>

            <div className="flex flex-row items-center justify-between gap-2">
              <p className="font-bold text-sm">Mostrar Comandas</p>
              <div className="flex items-center justify-between">
                <Toggle
                  isOn={showComandas}
                  onToggle={() => setShowComandas(!showComandas)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
