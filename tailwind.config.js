/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './ui-core/**/*.{js,ts,jsx,tsx}'],
  safelist: ['pt-1', 'pt-0.5', 'pt-2', 'pt-3', 'pt-4', 'text-green', 'bg-green', 'text-yellow', 'bg-yellow', 'text-accent', 'bg-accent', 'border-green', 'border-yellow', 'border-accent', 'text-green/10', 'bg-green/10', 'bg-yellow/10', 'bg-accent/10', 'border-green/20', 'border-yellow/20', 'border-accent/20'],
  theme: {
    extend: {
      colors: {
        charcoal: '#000000',
        cream: '#F8F5F0',
        'warm-white': '#FDFBF7',
        paper: '#F8F5F0',
        desk: '#E6E0D6',
        accent: '#C20000',
        green: '#336633',
        yellow: '#cc9837',
      },
      fontFamily: {
        serif: ['"PP Editorial Old"', 'Georgia', 'serif'],
        mono: ['"SF Mono"', 'Monaco', 'monospace'],
        sans: ['"SF Mono"', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        hard: '2px 2px 0px 0px rgba(0,0,0,1)',
        'hard-sm': '1px 1px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
};
