/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Thai"', 'Sarabun', 'Tahoma', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
