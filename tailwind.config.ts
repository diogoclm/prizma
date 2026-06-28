import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-rubik)", "system-ui", "sans-serif"],
      },
      colors: {
        // Escala de cinza da marca Prizma (PDF de brand assets)
        prizma: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EDEDED",
          300: "#D5D5D5",
          400: "#999999",
          500: "#5E5E5E",
          600: "#4D4D4D",
          700: "#3A3A3A",
          800: "#262626",
          900: "#000000",
        },
        // Acentos financeiros suaves (dessaturados, não competem com a marca)
        positive: {
          DEFAULT: "#5B8C6E",
          bg: "#F0F5F1",
          border: "#CFE0D5",
        },
        negative: {
          DEFAULT: "#B9695B",
          bg: "#F7EEEC",
          border: "#E6CFC8",
        },
        // Uma cor suave por categoria do dashboard (Hoteleiro, Terrenos, Incorporação)
        hotel: {
          bg: "#F5F1ED",
          border: "#E0D6C9",
          accent: "#8C7A66",
        },
        land: {
          bg: "#F3F1E6",
          border: "#E2DCC2",
          accent: "#9C8F5E",
        },
        incorp: {
          bg: "#EEF1F4",
          border: "#D6DEE6",
          accent: "#6B7E8F",
        },
      },
    },
  },
  plugins: [],
};

export default config;
