/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crimson: { DEFAULT: '#8B2635', light: '#B03045', dark: '#6B1A28' },
        gold: { DEFAULT: '#C9952B', light: '#E8B84B', dark: '#A07820' },
        cream: { DEFAULT: '#FDFAF5', dark: '#F5F0E8' },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
        serif: ['Noto Serif KR', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
