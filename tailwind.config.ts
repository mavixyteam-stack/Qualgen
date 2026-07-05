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
          DEFAULT: "#171232",
          soft: "#4d4670",
          muted: "#8b86a8",
          faint: "#bcb8d1",
        },
        surface: {
          DEFAULT: "#f2f0fa", // soft lavender canvas
          card: "#ffffff",
          sunken: "#f4f2fb",
          hover: "#f8f7fd",
        },
        brand: {
          50: "#f4f1ff",
          100: "#e9e3ff",
          200: "#d5c9ff",
          300: "#b3a0fd",
          400: "#9277f9",
          500: "#7b5af8", // primary
          600: "#6644ec",
          700: "#5233c8",
        },
        pastel: {
          lavender: "#e9e3ff",
          mint: "#d8f4e5",
          peach: "#ffe6d3",
          sky: "#dbecff",
          lemon: "#fff3c9",
          pink: "#ffdfec",
        },
        accent: {
          mint: "#0e8a55",
          peach: "#c25313",
          sky: "#1e64b8",
          lemon: "#93690a",
          pink: "#c2377a",
          red: "#e0403f",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,18,50,.03), 0 10px 30px -14px rgba(23,18,50,.10)",
        lift: "0 2px 6px rgba(23,18,50,.05), 0 18px 44px -16px rgba(23,18,50,.16)",
        glow: "0 8px 32px -8px rgba(123,90,248,.45)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #9d7bff 0%, #6c4df6 100%)",
        "coach-gradient": "linear-gradient(135deg, #a685ff 0%, #7b5af8 55%, #6440ee 100%)",
        "hero-glow": "radial-gradient(1200px 500px at 50% -10%, rgba(157,123,255,.18), transparent 70%)",
      },
      borderRadius: {
        "4xl": "1.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
