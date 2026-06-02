/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        'primary-cyan': 'hsl(var(--primary-cyan))',
        'primary-cyan-foreground': 'hsl(var(--primary-cyan-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
      },
      fontFamily: {
        body: ['Be Vietnam Pro', 'sans-serif'],
        heading: ['Be Vietnam Pro', 'sans-serif'],
      }
    }
  }
}