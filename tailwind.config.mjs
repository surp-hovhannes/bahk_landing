export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Token-driven aliases — reference the CSS custom properties
        // declared in src/styles/global.css so the design system is the
        // single source of truth. Tailwind v3 resolves var() at runtime.
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
      colors: {
        // Semantic tokens — use as bg-primary, text-accent, border-border, etc.
        primary:        'oklch(var(--primary-oklch) / <alpha-value>)',
        'primary-hover':'oklch(var(--primary-hover-oklch) / <alpha-value>)',
        accent:         'oklch(var(--accent-oklch) / <alpha-value>)',
        'accent-hover': 'oklch(var(--accent-hover-oklch) / <alpha-value>)',
        'accent-alt':   'oklch(var(--accent-alt-oklch) / <alpha-value>)',
        'accent-bright':'oklch(var(--accent-bright-oklch) / <alpha-value>)',
        // Neutrals
        bg:             'oklch(var(--bg-oklch) / <alpha-value>)',
        surface:        'oklch(var(--surface-oklch) / <alpha-value>)',
        fg:             'oklch(var(--fg-oklch) / <alpha-value>)',
        'fg-muted':     'oklch(var(--fg-muted-oklch) / <alpha-value>)',
        muted:          'oklch(var(--muted-oklch) / <alpha-value>)',
        'muted-on-dark':'oklch(var(--muted-on-dark-oklch) / <alpha-value>)',
        border:         'oklch(var(--border-oklch) / <alpha-value>)',
        // Semantic states
        success:        'oklch(var(--success-oklch) / <alpha-value>)',
        warn:           'oklch(var(--warn-oklch) / <alpha-value>)',
        danger:         'oklch(var(--danger-oklch) / <alpha-value>)',
      },
      backgroundImage: {
        'cta-gradient':       'var(--cta-gradient)',
        'cta-gradient-hover': 'var(--cta-gradient-hover)',
      },
      maxWidth: {
        content: 'var(--container-content)',
        prose:   'var(--container-prose)',
        chrome:  'var(--container-chrome)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ],
} 
