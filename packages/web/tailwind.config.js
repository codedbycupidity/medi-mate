/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors (mauve/dusty rose)
        brand: {
          50: '#faf8f9',
          100: '#f4f0f2',
          200: '#ede5e8',  // From palette
          300: '#dcc8d0',
          400: '#c6a5b3',
          500: '#a5818f',  // Main from palette
          600: '#8f6b7a',
          700: '#775964',
          800: '#644d55',
          900: '#554349',
        },
        // Accent colors (deep burgundy)
        accent: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d7',
          300: '#f4a8b7',
          400: '#ec7591',
          500: '#e0456e',
          600: '#c8325a',
          700: '#a8254a',
          800: '#4c0420',  // From palette
          900: '#2d0213',  // From palette
        },
        // Dark theme colors
        dark: {
          50: '#f8f6f7',
          100: '#f0ebee',
          200: '#e1d6dc',
          300: '#cab4c2',
          400: '#ad8ca1',
          500: '#926b81',
          600: '#7a5468',
          700: '#644554',
          800: '#533a47',
          900: '#1e010c',  // Darkest from palette
        },
        // Medical/health colors (adapted to theme)
        medical: {
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bce5cd',
          300: '#8dd0a8',
          400: '#57b37c',
          500: '#33975a',
          600: '#247847',
          700: '#1e5f3a',
          800: '#1a4d31',
          900: '#16402a',
        },
        // Status colors (keeping some medical functionality)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'], // More feminine font option
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(165, 129, 143, 0.1), 0 2px 4px -1px rgba(165, 129, 143, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(165, 129, 143, 0.1), 0 4px 6px -2px rgba(165, 129, 143, 0.05)',
        'feminine': '0 8px 25px -5px rgba(76, 4, 32, 0.1), 0 8px 10px -6px rgba(76, 4, 32, 0.1)',
      },
      backgroundImage: {
        'gradient-feminine': 'linear-gradient(135deg, #ede5e8 0%, #a5818f 100%)',
        'gradient-dark-feminine': 'linear-gradient(135deg, #4c0420 0%, #1e010c 100%)',
      },
    },
  },
  plugins: [],
}