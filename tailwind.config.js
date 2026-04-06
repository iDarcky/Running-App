const { heroui } = require("@heroui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EE0000',
          foreground: '#FFFFFF',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#EE0000",
              foreground: "#FFFFFF",
            },
            focus: "#EE0000",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#EE0000",
              foreground: "#FFFFFF",
            },
            focus: "#EE0000",
          },
        },
      },
    }),
  ],
};
