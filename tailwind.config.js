// tailwind.config.js
module.exports = {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
		"./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
	],
	theme: {
		extend: {
			backgroundColor: {
				"custom-red": "#FE0000",
			},
			textColor: {
				"custom-red": "#FE0000",
			},
			fontFamily: {
				coolvetica: ["Coolvetica", "sans-serif"],
				"coolvetica-compressed": ["Coolvetica Compressed", "sans-serif"],
				"coolvetica-condensed": ["Coolvetica Condensed", "sans-serif"],
				"coolvetica-crammed": ["Coolvetica Crammed", "sans-serif"],
				"coolvetica-ul": ["Coolvetica Ul", "sans-serif"],
				oswald: ["Oswald", "sans-serif"],
			},
			fontWeight: {
				thin: "200",
				light: "300",
				normal: "400",
				medium: "500",
				bold: "700",
				black: "900",
			},
			screens: {
				random: "463px",
			},
			colors: {
				"red-main": "#ff0000",
			},
		},
	},
	plugins: [],
};
