/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        military: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        olive: {
          50: '#f7f8f0',
          100: '#eef0de',
          200: '#dde2c0',
          300: '#c6cf9a',
          400: '#b0bd77',
          500: '#9aab5a',
          600: '#7a8a45',
          700: '#5f6b38',
          800: '#4f5730',
          900: '#434a2b',
        }
      },
      fontFamily: {
        'military': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
