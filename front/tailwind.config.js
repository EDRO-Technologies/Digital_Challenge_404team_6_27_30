/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gazprom: {
          blue: '#0072CE',
          light: '#00B5E2',
          gray: '#F3F4F6',
          success: '#10B981',
          gold: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}