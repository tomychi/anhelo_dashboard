import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import arrow from "../../assets/arrowIcon.png";

const formatInvestorName = (name) => {
  const parts = name.split(" ");
  if (parts.length > 1) {
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
  }
  return name;
};

// ScrollableTimeline wrapper component
const ScrollableTimeline = ({ children }) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef(null);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

    setShowLeftArrow(hasHorizontalScroll && !isAtStart);
    setShowRightArrow(hasHorizontalScroll && !isAtEnd);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      // Observe size changes
      const resizeObserver = new ResizeObserver(checkScrollPosition);
      resizeObserver.observe(container);

      return () => resizeObserver.disconnect();
    }
  }, []);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full">
      {/* Left scroll indicator */}
      {showLeftArrow && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => scroll("left")}
            className="bg-gray-100  bg-opacity-50 h-10 w-10 flex justify-center items-center rounded-full animate-pulse"
            aria-label="Scroll left"
          >
            <img src={arrow} className="h-2  rotate-180" alt="" />
          </button>
        </div>
      )}

      {/* Right scroll indicator */}
      {showRightArrow && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => scroll("right")}
            className="bg-gray-100  bg-opacity-50 h-10 w-10 flex justify-center items-center rounded-full animate-pulse"
            aria-label="Scroll right"
          >
            <img src={arrow} className="h-2  " alt="" />
          </button>
        </div>
      )}

      {/* Main scroll container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto w-full"
        onScroll={checkScrollPosition}
      >
        {children}
      </div>
    </div>
  );
};

const TimelineRange = ({
  start,
  end,
  investment,
  onDelete,
  row,
  startDate,
  totalWeeks,
}) => {
  return (
    <div
      className={`absolute h-20 mx-4 justify-center items-center rounded-lg flex flex-col px-2 cursor-pointer ${
        investment.paid ? "bg-green-500" : "bg-black"
      }`}
      style={{
        left: `${start}%`,
        width: `${end - start}%`,
        minWidth: "100px",
        top: `${row * 80 + 90}px`,
        transform: "translateY(-50%)",
      }}
    >
      <div className="w-full flex flex-col justify-start">
        <div className="flex flex-row gap-1 mb-1">
          {investment.paid ? (
            <></>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          <p className="text-white font-bold text-xs truncate">
            {formatInvestorName(investment.investorId)}
            {investment.paid && " (Pagado)"}
          </p>
        </div>
        <p className="text-white text-xs opacity-75">
          ${investment.monto} {investment.moneda}
        </p>
        <div className="text-white text-xs opacity-75">
          {investment.inicioEstimado?.toLocaleDateString("es-AR", {
            day: "numeric",
            month: "numeric",
          })}{" "}
          -{" "}
          {investment.finEstimado?.toLocaleDateString("es-AR", {
            day: "numeric",
            month: "numeric",
          })}
        </div>
      </div>
    </div>
  );
};

const PaymentTimeline = ({ investors }) => {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState({
    start: 0,
    end: 0,
  });
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showInvestmentSelect, setShowInvestmentSelect] = useState(false);
  const [previewRow, setPreviewRow] = useState(0);
  const timelineRef = useRef(null);

  // Flatten all investments with their investor information and convert dates
  const allInvestments = investors.flatMap((investor) =>
    investor.investments.map((investment, index) => {
      // Convertir todas las fechas a objetos Date
      const convertedInvestment = {
        ...investment,
        deadline:
          investment.deadline instanceof Date
            ? investment.deadline
            : investment.deadline?.toDate(),
        inicioEstimado:
          investment.inicioEstimado instanceof Date
            ? investment.inicioEstimado
            : investment.inicioEstimado?.toDate(),
        finEstimado:
          investment.finEstimado instanceof Date
            ? investment.finEstimado
            : investment.finEstimado?.toDate(),
        investorId: investor.id,
        investmentIndex: index,
        totalInvestments: investor.investments.length,
      };
      return convertedInvestment;
    })
  );

  const calculateRow = (
    newStart,
    newEnd,
    excludeIndex = -1,
    existingRanges = ranges
  ) => {
    let row = 0;
    const maxRow = 50; // Límite de seguridad para evitar bucles infinitos

    while (row < maxRow) {
      const hasOverlap = existingRanges.some(
        (range, index) =>
          index !== excludeIndex &&
          range.row === row &&
          ((newStart >= range.start && newStart <= range.end) ||
            (newEnd >= range.start && newEnd <= range.end) ||
            (newStart <= range.start && newEnd >= range.end))
      );

      if (!hasOverlap) {
        return row;
      }
      row++;
    }

    return 0; // Fallback por seguridad
  };

  const getStartDate = () => {
    // First, check if any investment has inicioEstimado before current date
    const currentDate = new Date();

    // Find earliest inicioEstimado across all investments
    const earliestInicioEstimado = investors.reduce((earliest, investor) => {
      const investmentDates = investor.investments
        .filter((inv) => inv.inicioEstimado) // Only consider investments with inicioEstimado
        .map((inv) =>
          inv.inicioEstimado instanceof Date
            ? inv.inicioEstimado
            : inv.inicioEstimado.toDate()
        );

      if (investmentDates.length === 0) return earliest;

      const investorEarliest = new Date(Math.min(...investmentDates));
      return earliest
        ? investorEarliest < earliest
          ? investorEarliest
          : earliest
        : investorEarliest;
    }, null);

    // If we found an inicioEstimado before current date, use it
    if (earliestInicioEstimado && earliestInicioEstimado < currentDate) {
      // Adjust to start of week
      const date = new Date(earliestInicioEstimado);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
      return date;
    }

    // Otherwise, use current date
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date;
  };

  const startDate = getStartDate();

  const latestDeadline = Math.max(
    ...allInvestments.map((inv) => inv.deadline.getTime())
  );

  const weekDiff = (start, end) => {
    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil((end - start) / msInWeek);
  };

  const totalWeeks = weekDiff(startDate.getTime(), latestDeadline);

  const formatDate = (percentage, options = {}) => {
    const defaultOptions = {};
    const mergedOptions = { ...defaultOptions, ...options };

    const totalDays = totalWeeks * 7;
    const daysToAdd = Math.floor((percentage / 100) * totalDays);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + daysToAdd);
    return date.toLocaleDateString("es-AR", mergedOptions);
  };

  const calculatePositionForInvestment = (investment) => {
    if (!investment.inicioEstimado || !investment.finEstimado) return null;

    const inicioEstimado =
      investment.inicioEstimado instanceof Date
        ? investment.inicioEstimado
        : investment.inicioEstimado.toDate();

    const finEstimado =
      investment.finEstimado instanceof Date
        ? investment.finEstimado
        : investment.finEstimado.toDate();

    const start =
      ((inicioEstimado.getTime() - startDate.getTime()) /
        (totalWeeks * 7 * 24 * 60 * 60 * 1000)) *
      100;
    const end =
      ((finEstimado.getTime() - startDate.getTime()) /
        (totalWeeks * 7 * 24 * 60 * 60 * 1000)) *
      100;

    return { start, end };
  };

  useEffect(() => {
    const initialRanges = allInvestments
      .filter((inv) => inv.inicioEstimado && inv.finEstimado)
      .map((investment) => {
        const position = calculatePositionForInvestment(investment);
        if (!position) return null;

        return {
          start: position.start,
          end: position.end,
          investment,
        };
      })
      .filter(Boolean);

    // Ordenar las barras por fecha de inicio para asegurar consistencia
    const sortedRanges = [...initialRanges].sort((a, b) => a.start - b.start);

    // Asignar filas secuencialmente, verificando solapamientos
    const rangesWithRows = sortedRanges.reduce((acc, range) => {
      const row = calculateRow(
        range.start,
        range.end,
        -1,
        acc.map((r) => ({ start: r.start, end: r.end, row: r.row }))
      );

      acc.push({
        ...range,
        row,
      });

      return acc;
    }, []);

    setRanges(rangesWithRows);
  }, [investors]);

  const getPercentageFromMouseEvent = (e) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rawPercentage = (x / rect.width) * 100;

    const weekWidth = 100 / totalWeeks;
    const weekIndex = Math.round(rawPercentage / weekWidth);
    return Math.max(0, Math.min(100, weekIndex * weekWidth));
  };

  const handleClick = (e) => {
    const percentage = getPercentageFromMouseEvent(e);

    if (!isSelecting) {
      setIsSelecting(true);
      setCurrentSelection({
        start: percentage,
        end: percentage,
      });
    } else {
      setIsSelecting(false);
      if (Math.abs(currentSelection.end - currentSelection.start) > 2) {
        setShowInvestmentSelect(true);
      } else {
        setCurrentSelection({ start: 0, end: 0 });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    const percentage = getPercentageFromMouseEvent(e);
    setCurrentSelection((prev) => ({
      ...prev,
      end: percentage,
    }));
  };

  useEffect(() => {
    if (isSelecting || showInvestmentSelect) {
      const start = Math.min(currentSelection.start, currentSelection.end);
      const end = Math.max(currentSelection.start, currentSelection.end);
      const row = calculateRow(start, end);
      setPreviewRow(row);
    }
  }, [currentSelection, isSelecting, showInvestmentSelect]);

  const addRange = async () => {
    if (selectedInvestment) {
      setLoading(true);
      const start = Math.min(currentSelection.start, currentSelection.end);
      const end = Math.max(currentSelection.start, currentSelection.end);
      const row = calculateRow(start, end);

      const totalDays = totalWeeks * 7;
      const startDays = Math.floor((start / 100) * totalDays);
      const endDays = Math.floor((end / 100) * totalDays);

      const inicioEstimado = new Date(startDate);
      inicioEstimado.setDate(startDate.getDate() + startDays);

      const finEstimado = new Date(startDate);
      finEstimado.setDate(startDate.getDate() + endDays);

      const investor = investors.find(
        (inv) => inv.id === selectedInvestment.investorId
      );

      if (investor) {
        const updatedInvestments = [...investor.investments];
        updatedInvestments[selectedInvestment.investmentIndex] = {
          ...updatedInvestments[selectedInvestment.investmentIndex],
          inicioEstimado,
          finEstimado,
        };

        try {
          const firestore = getFirestore();
          const inversionDoc = doc(firestore, "inversion", investor.id);

          await setDoc(inversionDoc, {
            investments: updatedInvestments,
          });

          const newRange = {
            start,
            end,
            investment: {
              ...selectedInvestment,
              inicioEstimado,
              finEstimado,
            },
            row,
          };

          const existingRangeIndex = ranges.findIndex(
            (range) =>
              range.investment.investorId === selectedInvestment.investorId &&
              range.investment.investmentIndex ===
                selectedInvestment.investmentIndex
          );

          if (existingRangeIndex !== -1) {
            setRanges(
              ranges.map((range, index) =>
                index === existingRangeIndex ? newRange : range
              )
            );
          } else {
            setRanges([...ranges, newRange]);
          }
        } catch (error) {
          console.error("Error al actualizar la inversión:", error);
          alert("Error al actualizar la inversión");
        } finally {
          setLoading(false);
        }
      }

      setCurrentSelection({ start: 0, end: 0 });
      setSelectedInvestment(null);
      setShowInvestmentSelect(false);
      setIsSelecting(false);
    }
  };

  const deleteRange = async (index) => {
    const rangeToDelete = ranges[index];
    const investor = investors.find(
      (inv) => inv.id === rangeToDelete.investment.investorId
    );

    if (investor) {
      const allInvestments = [...investor.investments];
      const investmentIndex = rangeToDelete.investment.investmentIndex;

      // Actualizamos la inversión específica en el array
      allInvestments[investmentIndex] = {
        deadline: allInvestments[investmentIndex].deadline,
        moneda: allInvestments[investmentIndex].moneda,
        monto: allInvestments[investmentIndex].monto,
      };

      // Actualizamos todo el documento con el nuevo array de inversiones
      const firestore = getFirestore();
      const inversionDoc = doc(firestore, "inversion", investor.id);

      try {
        await setDoc(inversionDoc, {
          investments: allInvestments,
        });
      } catch (error) {
        console.error("Error al actualizar las inversiones:", error);
      }
    }

    setRanges(ranges.filter((_, i) => i !== index));
  };

  const generateTimelineData = () => {
    const data = [];
    let currentDate = new Date(startDate);

    for (let week = 0; week < totalWeeks; week++) {
      const monthKey = format(currentDate, "MMMM", {
        locale: es,
      }).toUpperCase();

      let monthData = data.find((m) => m.label === monthKey);
      if (!monthData) {
        monthData = {
          label: monthKey,
          weeks: [],
        };
        data.push(monthData);
      }

      monthData.weeks.push({
        weekNum: week + 1,
        startPercentage: (week * 100) / totalWeeks,
        startDate: new Date(currentDate),
      });

      currentDate.setDate(currentDate.getDate() + 7);
    }

    return data;
  };

  const timelineData = generateTimelineData();

  const maxRow =
    ranges.length > 0
      ? Math.max(...ranges.map((range) => range.row), previewRow)
      : previewRow;
  const timelineHeight = Math.max(120, (maxRow + 1) * 80 + 100);

  return (
    <div className="font-coolvetica">
      <ScrollableTimeline>
        <div
          ref={timelineRef}
          className="relative cursor-crosshair"
          style={{
            width: `${totalWeeks * 100}px`,
            height: `${timelineHeight}px`,
          }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
        >
          {/* month label */}
          <div className="absolute w-full border-t border-opacity-20 border-black flex text-xs black">
            {timelineData.map((month, i) => (
              <div
                key={i}
                className="pl-4 flex-grow border-r h-2 pt-2 border-opacity-20 border-black font-bold"
                style={{
                  width: `${(month.weeks.length * 100) / totalWeeks}%`,
                }}
              >
                {month.label.charAt(0).toUpperCase() +
                  month.label.slice(1).toLowerCase()}
              </div>
            ))}
          </div>

          {/* week label */}
          <div className="absolute w-full flex border-b border-opacity-20 border-black bottom-0 text-xs text-black">
            {timelineData.flatMap((month) =>
              month.weeks.map((week) => (
                <div
                  key={`week-${week.weekNum}`}
                  className="pl-4 h-2 border-r border-black border-opacity-20 relative"
                  style={{
                    width: `${100 / totalWeeks}%`,
                    minWidth: "100px",
                  }}
                >
                  <span className="text-xs font-bold absolute bottom-[10px]">
                    s{week.weekNum}
                  </span>
                </div>
              ))
            )}
          </div>

          {ranges.map((range, i) => (
            <TimelineRange
              key={i}
              start={range.start}
              end={range.end}
              investment={range.investment}
              onDelete={() => deleteRange(i)}
              row={range.row}
              startDate={startDate}
              totalWeeks={totalWeeks}
            />
          ))}

          {(isSelecting || showInvestmentSelect) &&
            currentSelection.end - currentSelection.start > 0 && (
              <div
                className="absolute h-20 bg-black bg-opacity-50 rounded-lg flex flex-col justify-center px-2"
                style={{
                  left: `${Math.min(
                    currentSelection.start,
                    currentSelection.end
                  )}%`,
                  width: `${Math.abs(
                    currentSelection.end - currentSelection.start
                  )}%`,
                  minWidth: "20px",
                  top: `${previewRow * 80 + 90}px`,
                  transform: "translateY(-50%)",
                }}
              >
                <div className="text-gray-100 text-xs opacity-75">
                  {formatDate(
                    Math.min(currentSelection.start, currentSelection.end),
                    {
                      day: "numeric",
                      month: "numeric",
                    }
                  )}{" "}
                  -{" "}
                  {formatDate(
                    Math.max(currentSelection.start, currentSelection.end),
                    {
                      day: "numeric",
                      month: "numeric",
                    }
                  )}
                </div>
              </div>
            )}
        </div>
      </ScrollableTimeline>

      {showInvestmentSelect && (
        <div className="mt-4">
          <select
            value={selectedInvestment ? JSON.stringify(selectedInvestment) : ""}
            onChange={(e) => {
              if (!e.target.value) {
                setSelectedInvestment(null);
                return;
              }
              const parsed = JSON.parse(e.target.value);
              parsed.deadline = new Date(parsed.deadline);
              setSelectedInvestment(parsed);
            }}
            className="w-full px-4 h-10 bg-gray-200 appearance-none border rounded-md"
          >
            <option value="">Seleccionar inversión</option>
            {investors
              .map((investor) => {
                const investmentsWithIndices = investor.investments.map(
                  (investment, originalIndex) => ({
                    ...investment,
                    originalIndex,
                  })
                );

                const availableInvestments = investmentsWithIndices.filter(
                  (investment) => {
                    return !ranges.some((range) => {
                      const rangeDeadline = new Date(range.investment.deadline);
                      const investmentDeadline = new Date(investment.deadline);

                      return (
                        range.investment.investorId === investor.id &&
                        range.investment.monto === investment.monto &&
                        range.investment.moneda === investment.moneda &&
                        rangeDeadline.getTime() === investmentDeadline.getTime()
                      );
                    });
                  }
                );

                if (availableInvestments.length === 0) return null;

                return (
                  <optgroup
                    key={investor.id}
                    label={formatInvestorName(investor.id)}
                  >
                    {availableInvestments.map((investment) => (
                      <option
                        key={`${investor.id}-${investment.originalIndex}`}
                        value={JSON.stringify({
                          ...investment,
                          investorId: investor.id,
                          investmentIndex: investment.originalIndex,
                          totalInvestments: investor.investments.length,
                        })}
                      >
                        {formatInvestorName(investor.id)} (
                        {investment.originalIndex + 1}/
                        {investor.investments.length}): {investment.monto}{" "}
                        {investment.moneda} -{" "}
                        {new Date(investment.deadline).toLocaleDateString(
                          "es-AR"
                        )}
                      </option>
                    ))}
                  </optgroup>
                );
              })
              .filter(Boolean)}
          </select>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addRange}
              disabled={!selectedInvestment || loading}
              className="bg-black flex-1 h-20 font-bold text-2xl text-white px-4 rounded-md disabled:bg-gray-400"
            >
              {loading ? (
                <div className="flex justify-center">
                  <div className="flex flex-row gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              ) : (
                "Confirmar"
              )}
            </button>
            <button
              onClick={() => {
                setShowInvestmentSelect(false);
                setCurrentSelection({ start: 0, end: 0 });
                setIsSelecting(false);
              }}
              className="bg-gray-200 text-red-main h-20 flex-1 font-bold text-2xl px-4 rounded-md"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTimeline;
