import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#191233",
          soft: "#4b4368",
          muted: "#8b85a3",
          faint: "#b9b4cc",
        },
        surface: {
          DEFAULT: "#f8f7fc",
          card: "#ffffff",
          sunken: "#f1eff9",
        },
        brand: {
          50: "#f1effe",
          100: "#e4e0ff",
          200: "#cdc5ff",
          300: "#ab9df8",
          400: "#8a77f0",
          500: "#6c5ce7",
          600: "#5a48d6",
          700: "#4a3aa7",
        },
        pastel: {
          lavender: "#e4e0ff",
          mint: "#d5f5e5",
          peach: "#ffe3d0",
          sky: "#d8edff",
          lemon: "#fff4cc",
          pink: "#ffdfed",
        },
        accent: {
          mint: "#0f7a4d",
          peach: "#b04a12",
          sky: "#1c5cab",
          lemon: "#8a6100",
          pink: "#b0316e",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(25,18,51,0.04), 0 8px 24px -12px rgba(25,18,51,0.12)",
        lift: "0 2px 4px rgba(25,18,51,0.05), 0 16px 40px -16px rgba(25,18,51,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
