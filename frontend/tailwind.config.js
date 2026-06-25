/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        water: {
          light: '#4FC3F7',
          DEFAULT: '#2196F3',
          dark: '#1976D2',
        },
        terrain: {
          rural: '#7CFC00',
          suburban: '#F0E68C',
          urban: '#A9A9A9',
          railway: '#8B4513',
          forest: '#228B22',
          river: '#4169E1',
          heritage: '#DAA520',
        },
      },
    },
  },
  plugins: [],
}
