/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1956a8',
          50: '#eff5ff',
          100: '#dbe8fe',
          200: '#bfd4fe',
          300: '#93b4fd',
          400: '#6090f9',
          500: '#3b6ef5',
          600: '#1956a8',
          700: '#1a4a94',
          800: '#1b3d78',
          900: '#1c3464',
        },
        secondary: '#13C296',
        'body-color': '#637381',
        warning: '#FBBF24',
        danger: '#DC2626',
        success: '#219653',
        info: '#3B506C',
        light: '#F3F4F6',
        dark: {
          DEFAULT: '#1A222C',
          2: '#24303F',
          3: '#212B36',
          4: '#5B6B79',
          5: '#374151',
          6: '#4B5563',
          7: '#6B7280',
        },
        stroke: {
          light: '#E2E8F0',
          dark: '#313D4A',
        },
        whiten: {
          DEFAULT: '#F9FAFB',
          2: '#F3F4F6',
          3: '#E5E7EB',
          4: '#DEE2E6',
          5: '#CED4DA',
          6: '#CED4DA',
          7: '#CED4DA',
        },
        bodydark: {
          1: '#DEE4EE',
          2: '#8A99AF',
        },
        boxdark: {
          DEFAULT: '#24303F',
          2: '#1A222C',
        },
        strokedark: '#2E3A47',
        meta: {
          4: '#313D4A',
        },
      },
      keyframes: {
        pump: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '-600% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pump: 'pump 1.5s steps(6) infinite',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}
