/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      animation: {
        'streak-fire': 'streak-fire 0.8s ease-in-out infinite',
        'streak-pulse': 'streak-pulse 1.5s ease-in-out infinite',
        'rank-jump': 'rank-jump 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'rank-arrow': 'rank-arrow 0.6s ease-in-out infinite',
        'slide-in': 'slide-in 0.4s ease-out both',
        'podium-rise': 'podium-rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'crown-drop': 'crown-drop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'podium-glow-gold': 'podium-glow-gold 2s ease-in-out infinite',
        'podium-glow-silver': 'podium-glow-silver 2s ease-in-out infinite',
        'podium-glow-bronze': 'podium-glow-bronze 2s ease-in-out infinite',
      },
      keyframes: {
        'streak-fire': {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '25%': { transform: 'scale(1.15) rotate(-2deg)', filter: 'brightness(1.3)' },
          '50%': { transform: 'scale(1.05) rotate(1deg)', filter: 'brightness(1.1)' },
          '75%': { transform: 'scale(1.2) rotate(-1deg)', filter: 'brightness(1.4)' },
        },
        'streak-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 4px rgba(251, 146, 60, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 12px rgba(251, 146, 60, 0.6)' },
        },
        'rank-jump': {
          '0%': { transform: 'translateX(-30px) scale(0.95)', opacity: '0.5', boxShadow: '0 0 0 rgba(52, 211, 153, 0)' },
          '30%': { transform: 'translateX(8px) scale(1.04)', opacity: '1', boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)' },
          '50%': { transform: 'translateX(-4px) scale(1.02)' },
          '70%': { transform: 'translateX(2px) scale(1.01)' },
          '100%': { transform: 'translateX(0) scale(1)', boxShadow: '0 0 8px rgba(52, 211, 153, 0.15)' },
        },
        'rank-arrow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-40px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'podium-rise': {
          '0%': { transform: 'translateY(60px) scaleY(0.3)', opacity: '0' },
          '60%': { transform: 'translateY(-8px) scaleY(1.05)', opacity: '1' },
          '100%': { transform: 'translateY(0) scaleY(1)' },
        },
        'crown-drop': {
          '0%': { transform: 'translateY(-50px) rotate(-15deg)', opacity: '0' },
          '50%': { transform: 'translateY(5px) rotate(5deg)', opacity: '1' },
          '75%': { transform: 'translateY(-3px) rotate(-2deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        'podium-glow-gold': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(250, 204, 21, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(250, 204, 21, 0.6), 0 0 50px rgba(250, 204, 21, 0.2)' },
        },
        'podium-glow-silver': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(203, 213, 225, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(203, 213, 225, 0.5), 0 0 50px rgba(203, 213, 225, 0.15)' },
        },
        'podium-glow-bronze': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(217, 119, 6, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(217, 119, 6, 0.5), 0 0 50px rgba(217, 119, 6, 0.15)' },
        },
      },
    },
  },
  plugins: [],
};
