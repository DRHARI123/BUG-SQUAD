/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#09090b', // Deepest black background
          900: '#121215', // Sidebar / Surface background
          850: '#18181b', // Card background
          800: '#27272a', // Card hover / border
          700: '#3f3f46',
          600: '#52525b',
        },
        brand: {
          red: '#ef4444',
          orange: '#f97316',
          darkRed: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'glow-orange': '0 0 20px -3px rgba(249, 115, 22, 0.35)',
        'card-dark': '0 4px 20px 0 rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
