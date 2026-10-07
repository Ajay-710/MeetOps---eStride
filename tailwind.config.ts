import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        charcoal: "#2F3542",
        rust: "#C84B31",
        lime: "#CEFF1A",
        "paper-cool": "#E8ECEF",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      boxShadow: {
        brutal: "4px 4px 0px #2F3542",
        "brutal-sm": "2px 2px 0px #2F3542",
        "brutal-lg": "6px 6px 0px #2F3542",
        "brutal-dark": "4px 4px 0px #F5F2EB",
        "brutal-sm-dark": "2px 2px 0px #F5F2EB",
      },
    },
  },
  plugins: [],
};

export default config;
