import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        neon: {
          cyan: "hsl(var(--neon-cyan))",
          purple: "hsl(var(--neon-purple))",
          pink: "hsl(var(--neon-pink))",
        },
        gold: "hsl(var(--gold))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Luxury fade-in with blur
        "luxury-fade-in": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(24px)",
            filter: "blur(4px)"
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)",
            filter: "blur(0)"
          },
        },
        // Gentle float for idle cards
        "luxury-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        // Subtle glow pulse for buttons
        "glow-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(var(--secondary) / 0.3), 0 0 40px hsl(var(--secondary) / 0.1)"
          },
          "50%": { 
            boxShadow: "0 0 30px hsl(var(--secondary) / 0.5), 0 0 60px hsl(var(--secondary) / 0.2)"
          },
        },
        // Gradient shift for buttons
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Luxury animations
        "fade-in": "luxury-fade-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in-delay-1": "luxury-fade-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.12s forwards",
        "fade-in-delay-2": "luxury-fade-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.24s forwards",
        "fade-in-delay-3": "luxury-fade-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.36s forwards",
        "fade-in-delay-4": "luxury-fade-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.48s forwards",
        "fade-in-delay-5": "luxury-fade-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.60s forwards",
        // Idle float
        "float": "luxury-float 10s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "float-delayed": "luxury-float 10s cubic-bezier(0.22, 1, 0.36, 1) 3.3s infinite",
        "float-delayed-2": "luxury-float 10s cubic-bezier(0.22, 1, 0.36, 1) 6.6s infinite",
        // Button effects
        "glow-pulse": "glow-pulse 7s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        shimmer: "shimmer 2s linear infinite",
        "scale-in": "scale-in 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern": "linear-gradient(to bottom, hsl(var(--background)), transparent)",
      },
      transitionTimingFunction: {
        "luxury": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "600": "600ms",
        "700": "700ms",
        "800": "800ms",
        "900": "900ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
