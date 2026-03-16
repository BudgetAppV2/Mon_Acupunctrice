/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f4f7f4',
          100: '#e5ede5',
          200: '#c8d9c8',
          300: '#9dbb9d',
          400: '#6e976e',
          500: '#4e7a4e',
          600: '#3c613c',
          700: '#324e32',
          800: '#29402a',
          900: '#223523',
        },
        sand: {
          50:  '#faf8f4',
          100: '#f3ede2',
          200: '#e5d9c3',
          300: '#d3be9c',
          400: '#be9e72',
          500: '#ad8757',
          600: '#9f754b',
          700: '#855f3f',
          800: '#6d4e38',
          900: '#594030',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
