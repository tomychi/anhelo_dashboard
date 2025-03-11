import React from "react";

interface LoadingPointsProps {
  className?: string;
  color?: string;
}

const LoadingPoints: React.FC<LoadingPointsProps> = ({
  className = "",
  color = "text-gray-900",
}) => {
  return (
    <div
      className={`flex flex-row gap-1 ${className} ${color} items-center justify-center`}
    >
      <div className="w-2 h-2 rounded-full animate-pulse bg-current"></div>
      <div
        className="w-2 h-2 rounded-full animate-pulse bg-current"
        style={{ animationDelay: "0.25s" }}
      ></div>
      <div
        className="w-2 h-2 rounded-full animate-pulse bg-current"
        style={{ animationDelay: "0.5s" }}
      ></div>
    </div>
  );
};

export default LoadingPoints;
