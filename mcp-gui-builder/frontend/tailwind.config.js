/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired dark theme palette
        dark: {
          bg: '#000000',        // Pure black background
          surface: '#0a0a0a',   // Subtle dark surface
          card: '#111111',      // Card background
          border: '#1a1a1a',    // Subtle borders
          muted: '#333333',     // Muted text/elements
        },
        // Glowing/metallic accent colors
        accent: {
          silver: '#c0c0c0',    // Silver accents
          neon: '#00d4ff',      // Neon blue
          purple: '#8b5cf6',    // Subtle purple
          glow: '#ffffff',      // White glow
        },
        // Text colors
        text: {
          primary: '#ffffff',   // High contrast white
          secondary: '#a1a1aa', // Muted gray
          tertiary: '#71717a',  // Subtle gray
        },
        // Status colors
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'apple-gradient': 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #111111 100%)',
        'card-gradient': 'linear-gradient(145deg, #111111 0%, #1a1a1a 100%)',
        'glow-gradient': 'linear-gradient(135deg, rgba(192,192,192,0.1) 0%, rgba(0,212,255,0.1) 100%)',
      },
      boxShadow: {
        'apple': '0 4px 20px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(192, 192, 192, 0.3)',
        'neon': '0 0 20px rgba(0, 212, 255, 0.4)',
        'inner-glow': 'inset 0 1px 3px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 20px rgba(192, 192, 192, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(192, 192, 192, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      fontFamily: {
        'apple': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}