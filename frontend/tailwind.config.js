/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Lato", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Lato", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        serif: ["'Playfair Display'", "Georgia", "serif"],
        label: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        terracotta: {
          DEFAULT: "#0A3D62",
          hover: "#1A5276",
          soft: "#E6EDF2",
        },
        navy: {
          DEFAULT: "#0A3D62",
          deep: "#072B46",
          hover: "#1A5276",
          soft: "#E6EDF2",
          ink: "#0A3D62",
        },
        ocean: {
          DEFAULT: "#0A3D62",
          light: "#1A5276",
          deep: "#072B46",
          soft: "#E6EDF2",
        },
        gold: {
          DEFAULT: "#F5A623",
          hover: "#D4891A",
          soft: "#FEF3DF",
          deep: "#E8722A",
          ink: "#8A5E15",
        },
        sand: {
          DEFAULT: "#F7F3ED",
          deep: "#EDE5DA",
        },
        driftwood: "#8D7B68",
        fog: "#C8BDB4",
        charcoal: "#1C1C1E",
        success: { DEFAULT: "#27AE60", soft: "#E9F7EF" },
        warning: { DEFAULT: "#F39C12", soft: "#FEF9E7" },
        danger: { DEFAULT: "#E74C3C", soft: "#FDEDEC" },
        sky: "#2980B9",
        ink: {
          900: "#1C1C1E",
          600: "#525252",
          500: "#8D7B68",
          300: "#C8BDB4",
          200: "#E5E5E5",
          100: "#EDE5DA",
          50: "#F7F3ED",
          0: "#F7F3ED",
        },
      },
      boxShadow: {
        lift: "0 2px 8px rgba(10, 61, 98, 0.07)",
        float: "0 6px 20px rgba(10, 61, 98, 0.10)",
        hover: "0 12px 32px rgba(10, 61, 98, 0.14)",
        modal: "0 20px 60px rgba(10, 61, 98, 0.20)",
      },
      backgroundImage: {
        sunset: "linear-gradient(135deg, #F5A623 0%, #E8722A 100%)",
        "ocean-grad": "linear-gradient(180deg, #0A3D62 0%, #1A5276 100%)",
        sand: "linear-gradient(180deg, #F7F3ED 0%, #EDE5DA 100%)",
        aurora: "linear-gradient(135deg, #0A3D62 0%, #2980B9 50%, #F5A623 100%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "progress": {
          "0%": { width: "0%", marginLeft: "0%" },
          "50%": { width: "60%", marginLeft: "20%" },
          "100%": { width: "0%", marginLeft: "100%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.45s ease-out both",
        "progress": "progress 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
