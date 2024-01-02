// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundColor: {
        'custom-red': '#FE0000',
      },
      textColor: {
        'custom-red': '#FE0000',
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        antonio: ['Antonio', 'sans-serif'],
        kotch: ['Koch Fette Deutsche Schrift', 'sans-serif'],
      },
      screens: {
        random: '463px',
      },
      colors: {
        'red-main': '#ff0000',
      },
    },
  },
  plugins: [],
};
