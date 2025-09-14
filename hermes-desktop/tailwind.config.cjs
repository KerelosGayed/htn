/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f0fff4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        ink: '#0a0f0a',
        neon: {
          purple: '#b794f4',
          blue: '#60a5fa',
          gold: '#fbbf24'
        }
      },
      fontFamily: {
        display: ['Segoe UI', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 10px rgba(34,197,94,0.5), 0 0 30px rgba(34,197,94,0.2)'
      }
    }
  },
  plugins: []
};
