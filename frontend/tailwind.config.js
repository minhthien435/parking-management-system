/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // set theme by class
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          250: '#cbd5e1',
          350: '#94a3b8',
          450: '#64748b',
          505: '#475569',
          550: '#475569',
          650: '#334155',
          655: '#334155',
          750: '#1e293b',
          850: '#0f172a',
          955: '#020617',
        },
        blue: {
          450: '#3b82f6',
          955: '#0c4a6e',
        },
        emerald: {
          450: '#10b981',
        },
        red: {
          955: '#450a0a',
        },
        amber: {
          955: '#451a03',
        },
        green: {
          750: '#15803d',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      
      keyframes: {
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(10000%)' }, // Điều chỉnh 10000% tùy độ cao luồng video
          '100%': { transform: 'translateY(0%)' },
        },
      },
      animation: {
        'wobble-slow': 'wobble 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
