/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapea las variables CSS para que Tailwind las use
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        
        // También define los colores de marca para uso directo
        brand: {
          blue: 'var(--brand-blue)',
          'blue-dark': 'var(--brand-blue-dark)',
          navy: 'var(--brand-navy)',
          red: 'var(--brand-red)',
        }
      },
    },
  },
  plugins: [],
};