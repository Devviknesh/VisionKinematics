/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0c0e12',
          900: '#11141a',
          850: '#161b22',
          800: '#1c222c',
          750: '#232a36',
          700: '#2c3545',
          600: '#3d485c',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        brand: {
          amber: '#f59e0b',
          yellow: '#fbbf24',
          slate: '#1c222c',
          accent: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
