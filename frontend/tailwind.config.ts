import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          soft:    "#111111",
          muted:   "#1a1a1a",
        },
        ash: {
          DEFAULT: "#f5f5f5",
          soft:    "#ebebeb",
          muted:   "#d4d4d4",
        },
        accent: {
          violet:  "#7c3aed",
          violetL: "#a78bfa",
          blue:    "#2563eb",
          blueL:   "#60a5fa",
          cyan:    "#0891b2",
          cyanL:   "#22d3ee",
          green:   "#059669",
          greenL:  "#34d399",
          amber:   "#d97706",
          amberL:  "#fbbf24",
          rose:    "#e11d48",
          roseL:   "#fb7185",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-up":    "fadeUp 0.6s ease forwards",
        "fade-in":    "fadeIn 0.5s ease forwards",
        "slide-left": "slideLeft 0.6s ease forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":  "spin 8s linear infinite",
        "border-spin":"borderSpin 4s linear infinite",
        "marquee":    "marquee 30s linear infinite",
      },
      keyframes: {
        fadeUp:     { "0%":   { opacity:"0", transform:"translateY(24px)" }, "100%": { opacity:"1", transform:"translateY(0)" } },
        fadeIn:     { "0%":   { opacity:"0" },                               "100%": { opacity:"1" } },
        slideLeft:  { "0%":   { opacity:"0", transform:"translateX(24px)" }, "100%": { opacity:"1", transform:"translateX(0)" } },
        borderSpin: { "0%":   { transform:"rotate(0deg)" },                  "100%": { transform:"rotate(360deg)" } },
        marquee:    { "0%":   { transform:"translateX(0%)" },                "100%": { transform:"translateX(-50%)" } },
      },
      backgroundImage: {
        "grid-white": "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
        "grid-black": "linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)",
        "dot-white":  "radial-gradient(rgba(255,255,255,.15) 1px, transparent 1px)",
        "glow-white": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.15), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
