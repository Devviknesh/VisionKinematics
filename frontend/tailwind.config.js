/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Framewise brand palette
        fw: {
          bg:      '#08090C',
          surface: '#101116',
          card:    '#14151B',
          border:  '#1E1E2A',
          muted:   '#A1A1AA',
          text:    '#F5F5F7',
        },
        violet: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'fw-radial': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.15), transparent)',
        'fw-mesh':   'radial-gradient(ellipse 60% 40% at 70% 60%, rgba(139,92,246,0.08), transparent)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'violet': '0 0 0 1px rgba(139,92,246,0.3), 0 4px 24px rgba(139,92,246,0.15)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.3)',
      },
    },
  },
  plugins: [],
}
