/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f9',
          100: '#d5deee',
          200: '#aabcdc',
          500: '#2c4a7e',
          700: '#162a4f',
          800: '#0f1f3d',
          900: '#0a152b',
        },
        brass: {
          100: '#f6ecd6',
          300: '#dcbf7f',
          500: '#b5893c',
          600: '#996f2a',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
};
