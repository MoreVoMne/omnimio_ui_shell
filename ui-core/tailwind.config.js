/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#2C2C2C',
        cream: '#F5F0E8',
        'warm-white': '#FDFBF7',
      },
      fontFamily: {
        serif: ['"PP Editorial Old"', 'Georgia', 'serif'],
        mono: ['"SF Mono"', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}

