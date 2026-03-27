// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        // agar body ke liye default sans-serif chahiye (Inter ya system)
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      colors: {
        // agar custom colors chahiye to yahan add kar sakti ho
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px', // iPad Pro portrait
      'ipad-pro': '1112px', // custom for some iPad Pro models if needed
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
  
  plugins: [require("tailwindcss-animate")],
};