/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        malayalam: ["Noto Sans Malayalam", "Manjari", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#1A0E08",
        "bg-2": "#24140B",
        "bg-3": "#2F180A",
        card: "#24170F",
        "card-2": "#2A1B12",
        "card-hover": "#342015",
        border: "rgba(255,255,255,0.08)",
        "border-glass": "rgba(255,255,255,0.12)",
        "extreme-hot": "#FF3B30",
        "hot": "#FF9800",
        "not-hot": "#22C55E",
        text: {
          primary: "#FFF5E6",
          secondary: "#D9C8B6",
          muted: "#9A8B7C",
          disabled: "#6A5A4B",
        },
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.2s ease-out",
        "pulse-live": "pulse-live 1.4s ease-in-out infinite",
        "fade-up": "fade-up 0.4s cubic-bezier(.4,0,.2,1)",
      },
    },
  },
  plugins: [],
};
