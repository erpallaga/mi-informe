import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    borderRadius: {
      DEFAULT: "0px",
      none: "0px",
      sm: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "0px",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#f9f9fb",
          dim: "#d9dadc",
          bright: "#f9f9fb",
          container: {
            DEFAULT: "#eeeef0",
            low: "#f3f3f5",
            high: "#e8e8ea",
            highest: "#e2e2e4",
            lowest: "#ffffff",
          },
          variant: "#e2e2e4",
          tint: "#5e5e5e",
        },
        primary: {
          DEFAULT: "#000000",
          container: "#3b3b3b",
          fixed: "#5e5e5e",
          "fixed-dim": "#474747",
        },
        "on-primary": {
          DEFAULT: "#e2e2e2",
          container: "#ffffff",
          fixed: "#ffffff",
          "fixed-variant": "#e2e2e2",
        },
        secondary: {
          DEFAULT: "#5f5e5e",
          container: "#d6d4d3",
          fixed: "#c8c6c6",
          "fixed-dim": "#acabab",
        },
        "on-secondary": {
          DEFAULT: "#ffffff",
          container: "#1b1c1c",
          fixed: "#1b1c1c",
          "fixed-variant": "#3b3b3b",
        },
        tertiary: {
          DEFAULT: "#3b3b3c",
          container: "#747474",
          fixed: "#5e5e5e",
          "fixed-dim": "#464747",
        },
        outline: {
          DEFAULT: "#777777",
          variant: "#c6c6c6",
        },
        "on-surface": {
          DEFAULT: "#1a1c1d",
          variant: "#474747",
        },
        "on-background": "#1a1c1d",
        background: "#f9f9fb",
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        "on-error": {
          DEFAULT: "#ffffff",
          container: "#410002",
        },
        inverse: {
          surface: "#2f3132",
          "on-surface": "#f0f0f2",
          primary: "#c6c6c6",
        },
      },
      boxShadow: {
        ambient: "0 4px 60px rgba(26, 28, 29, 0.04)",
        "ambient-sm": "0 2px 40px rgba(26, 28, 29, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
