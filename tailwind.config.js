/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          river: '#0284c7',
          forest: '#15803d',
          wood: '#92400e',
          leaf: '#22c55e',
          amber: '#f59e0b',
        }
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 1.5s infinite ease-in-out',
        'pulse-subtle': 'pulse-subtle 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(0.98)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)' },
          '100%': { transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
