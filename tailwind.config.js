/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./live-classroom.jsx"
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0E14",
        darkSurface: "#141822",
        darkRaised: "#1B2029",
        darkBorder: "#262C3A",
        amberAccent: "#E8A33D",
        greenAccent: "#5FC08B",
        redAccent: "#E5484D",
      },
    },
  },
  plugins: [],
}
