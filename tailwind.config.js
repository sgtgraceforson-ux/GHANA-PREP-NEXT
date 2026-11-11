/** @type {import('tailwindcss').Config} */
const c = (n) => `hsl(var(--${n}))`
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    borderRadius: { none: '0', DEFAULT: '8px', sm: '8px', md: '8px', lg: '8px', xl: '8px', '2xl': '8px', full: '8px' }, // 8px only
    extend: {
      colors: {
        border: c('border'), input: c('border'), ring: c('primary'),
        background: c('background'), foreground: c('foreground'),
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        card: { DEFAULT: c('card'), foreground: c('foreground') },
        streak: c('streak'),
      },
    },
  },
  plugins: [],
}
