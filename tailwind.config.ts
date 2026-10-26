import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201d",
        paper: "#f8f8f5",
        lime: "#c6f36b",
        moss: "#456b50"
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 55px rgba(23, 32, 29, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
