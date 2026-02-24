import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        amber: {
          grid: "#ffbf00",
          dim: "#cc9900",
          glow: "rgba(255, 191, 0, 0.15)",
        },
        emerald: {
          electric: "#00ff88",
          dark: "#00cc6a",
          glow: "rgba(0, 255, 136, 0.15)",
        },
        grid: {
          bg: "#0a0a0f",
          surface: "#12121a",
          border: "#1e1e2e",
          muted: "#71717a",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "monospace"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "marching-ants": "dashOffset 1s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(255, 191, 0, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(255, 191, 0, 0.4)" },
        },
        dashOffset: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-20" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
