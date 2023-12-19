// tailwind.config.js
module.exports = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			backgroundColor: {
				"custom-red": "#FE0000",
			},
			textColor: {
				"custom-red": "#FE0000",
			},
		},
	},
	plugins: [],
};
