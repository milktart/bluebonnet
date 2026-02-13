/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      screens: {
        // 2-tier responsive breakpoint system optimized for mobile-first design
        // mobile: 0-639px (all phones and tablets in portrait)
        // desktop: 640px+ (tablets landscape and all desktops)
        mobile: '0px', // Base (mobile-first): 0-639px
        desktop: '640px', // Desktop and tablet landscape: 640px+
        // Kept for backwards compatibility: lg is used in some legacy components
        lg: '1024px', // Legacy: Desktop/Laptop (kept for backwards compat only)
      },
      colors: {
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          900: '#111827',
        },
        green: {
          500: '#10b981',
        },
        red: {
          500: '#ef4444',
        },
        yellow: {
          500: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
