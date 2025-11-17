/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#030014",
      },
      fontSize: {
        // 調整基礎字體大小，整體放大約 15-20%
        xs: ["13px", { lineHeight: "16px" }],
        sm: ["15px", { lineHeight: "20px" }],
        base: ["17px", { lineHeight: "24px" }],
        lg: ["19px", { lineHeight: "26px" }],
        xl: ["22px", { lineHeight: "28px" }],
        "2xl": ["26px", { lineHeight: "32px" }],
        "3xl": ["32px", { lineHeight: "38px" }],
        "4xl": ["38px", { lineHeight: "44px" }],
      },
    },
  },
  plugins: [],
};
