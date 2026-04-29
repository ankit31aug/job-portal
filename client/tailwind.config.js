/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a' },
        brand: {
          50: '#E6F0FF',
          100: '#CBDDF8',
          300: '#7fb8f0',
          400: '#5ba8eb',
          500: '#3791E5',
          600: '#2a7bcf',
          700: '#01417C',
          800: '#013361',
          900: '#012249',
        }
      }
    }
  },
  plugins: []
};
