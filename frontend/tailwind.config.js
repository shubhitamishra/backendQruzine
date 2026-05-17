/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Color Palette
        burgundy: {
          50: '#fef2f2',
          100: '#fde6e6',
          200: '#fbd0d0',
          300: '#f7a8a8',
          400: '#f17373',
          500: '#e74c3c',
          600: '#d73527',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7c2d12', // Deep burgundy for backgrounds
          950: '#5c1a0f',
        },
        
        // Forest Green Palette
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534', // Dark forest green for text/nav
          900: '#14532d',
          950: '#052e16',
        },
        
        // Bronze/Gold Accent Palette
        bronze: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Primary bronze
          600: '#d97706',
          700: '#b45309', // Darker bronze for borders
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        
        // Custom semantic colors
        primary: {
          DEFAULT: '#7c2d12', // Deep burgundy
          light: '#991b1b',
          dark: '#5c1a0f',
        },
        
        secondary: {
          DEFAULT: '#166534', // Dark forest green
          light: '#15803d',
          dark: '#14532d',
        },
        
        accent: {
          DEFAULT: '#f59e0b', // Bronze
          light: '#fbbf24',
          dark: '#b45309',
        },
        
        // UI Colors
        background: {
          primary: '#7c2d12',
          secondary: '#166534',
          card: 'rgba(22, 101, 52, 0.8)', // Semi-transparent forest green
          overlay: 'rgba(124, 45, 18, 0.9)',
        },
        
        text: {
          primary: '#166534', // Forest green for main text
          secondary: '#f59e0b', // Bronze for highlights
          light: '#dcfce7', // Light green for contrast
          muted: 'rgba(22, 101, 52, 0.7)',
        },
        
        border: {
          primary: '#f59e0b', // Bronze borders
          secondary: '#b45309', // Darker bronze
          subtle: 'rgba(245, 158, 11, 0.3)',
        }
      },
      
      // Custom gradients
      backgroundImage: {
        'burgundy-gradient': 'linear-gradient(135deg, #7c2d12 0%, #991b1b 100%)',
        'forest-gradient': 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
        'bronze-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'luxury-gradient': 'linear-gradient(135deg, #7c2d12 0%, #166534 50%, #f59e0b 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(22, 101, 52, 0.9) 0%, rgba(22, 101, 52, 0.7) 100%)',
      },
      
      // Custom shadows
      boxShadow: {
        'bronze': '0 4px 6px -1px rgba(245, 158, 11, 0.3), 0 2px 4px -1px rgba(245, 158, 11, 0.2)',
        'bronze-lg': '0 10px 15px -3px rgba(245, 158, 11, 0.3), 0 4px 6px -2px rgba(245, 158, 11, 0.2)',
        'burgundy': '0 4px 6px -1px rgba(124, 45, 18, 0.3), 0 2px 4px -1px rgba(124, 45, 18, 0.2)',
        'forest': '0 4px 6px -1px rgba(22, 101, 52, 0.3), 0 2px 4px -1px rgba(22, 101, 52, 0.2)',
        'luxury': '0 20px 25px -5px rgba(124, 45, 18, 0.4), 0 10px 10px -5px rgba(245, 158, 11, 0.2)',
      },
      
      // Custom border radius
      borderRadius: {
        'luxury': '12px',
        'card': '16px',
      },
      
      // Custom typography
      fontFamily: {
        'luxury': ['Playfair Display', 'serif'],
        'elegant': ['Crimson Text', 'serif'],
        'modern': ['Inter', 'sans-serif'],
      },
      
      // Custom spacing for luxury feel
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Animation enhancements
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Custom plugin for luxury components
    function({ addUtilities }) {
      const newUtilities = {
        '.text-luxury': {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        '.border-luxury': {
          border: '2px solid',
          borderImageSource: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderImageSlice: '1',
        },
        '.glass-effect': {
          backgroundColor: 'rgba(22, 101, 52, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}