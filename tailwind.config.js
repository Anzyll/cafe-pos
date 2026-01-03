/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
     theme: {
    extend: {
      colors: {
        brand: {
          orange: '#EA6031',
          orangeDark: '#D1542B',
          orangeLight: '#F07A4A'
        }
      }
    }
  },
    plugins: [],
    
}
