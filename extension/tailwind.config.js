/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        'brand': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
  // 只在生产模式下启用purgecss
  purge: process.env.NODE_ENV === 'production' ? {
    enabled: true,
    content: ['./src/**/*.{ts,tsx,js,jsx}', './public/**/*.html'],
  } : {},
}; 