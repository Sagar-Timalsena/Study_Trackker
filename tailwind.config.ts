import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-primary": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 var(--primary)",
            opacity: "1"
          },
          "50%": { 
            boxShadow: "0 0 0 10px transparent",
            opacity: "0.8"
          },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-primary": "pulse-primary 2s infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      minHeight: {
        "screen-75": "75vh",
        "screen-90": "90vh",
      },
      boxShadow: {
        "inner-lg": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        "colored": "0 4px 14px 0 var(--primary, rgba(59, 130, 246, 0.15))",
        "colored-lg": "0 10px 25px -3px var(--primary, rgba(59, 130, 246, 0.1))",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "study-pattern": "linear-gradient(45deg, transparent 49%, var(--primary, #3B82F6) 49%, var(--primary, #3B82F6) 51%, transparent 51%)",
      },
      screens: {
        "xs": "475px",
        "3xl": "1600px",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for study tracker specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.animation-delay-75': {
          'animation-delay': '75ms',
        },
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.animation-delay-300': {
          'animation-delay': '300ms',
        },
        '.progress-bar': {
          'background': 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
          'border-radius': theme('borderRadius.full'),
          'height': theme('spacing.2'),
          'transition': 'width 0.3s ease-in-out',
        },
        '.glass-morphism': {
          'backdrop-filter': 'blur(16px) saturate(180%)',
          'background-color': 'rgba(255, 255, 255, 0.75)',
          'border': '1px solid rgba(209, 213, 219, 0.3)',
        },
        '.dark .glass-morphism': {
          'background-color': 'rgba(17, 24, 39, 0.75)',
          'border': '1px solid rgba(75, 85, 99, 0.3)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;
