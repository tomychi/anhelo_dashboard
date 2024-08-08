import React from "react";
import { NavLink } from "react-router-dom";

export const AnheloRidersStats = () => {
	return (
		<div className="bg-red-main p-4">
			<NavLink to="/anheloriders" className="flex flex-col items-start">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="1.5"
					stroke="currentColor"
					className="w-6 transform rotate-180"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					/>
				</svg>
				<p className="text-xs font-black font-antonio uppercase">volver</p>
			</NavLink>
		</div>
	);
};
