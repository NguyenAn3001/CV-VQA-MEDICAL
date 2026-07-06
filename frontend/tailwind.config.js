/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        "on-surface-variant": "#434655",
        "inverse-surface": "#2d3133",
        "on-primary-fixed": "#00174b",
        "error": "#ba1a1a",
        "on-tertiary": "#ffffff",
        "surface": "#f7f9fb",
        "tertiary-fixed": "#ffdbcd",
        "primary-fixed": "#dbe1ff",
        "surface-container-low": "#f2f4f6",
        "secondary-fixed": "#d3e4fe",
        "surface-container-high": "#e6e8ea",
        "on-tertiary-fixed-variant": "#7d2d00",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "surface-white": "#ffffff",
        "on-secondary-fixed-variant": "#38485d",
        "surface-bright": "#f7f9fb",
        "surface-variant": "#e0e3e5",
        "medical-success": "#10b981",
        "tertiary-container": "#bc4800",
        "secondary-container": "#d0e1fb",
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#54647a",
        "on-surface": "#191c1e",
        "tertiary": "#943700",
        "border-subtle": "#e2e8f0",
        "outline": "#737686",
        "medical-error": "#ef4444",
        "outline-variant": "#c3c6d7",
        "on-tertiary-container": "#ffede6",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#eeefff",
        "inverse-primary": "#b4c5ff",
        "surface-container": "#eceef0",
        "secondary-fixed-dim": "#b7c8e1",
        "error-container": "#ffdad6",
        "on-secondary": "#ffffff",
        "inverse-on-surface": "#eff1f3",
        "on-primary-fixed-variant": "#003ea8",
        "sidebar-bg": "#f9fafb",
        "on-secondary-fixed": "#0b1c30",
        "tertiary-fixed-dim": "#ffb596",
        "surface-tint": "#0053db",
        "surface-container-highest": "#e0e3e5",
        "primary-container": "#2563eb",
        "on-tertiary-fixed": "#360f00",
        "on-background": "#191c1e",
        "surface-dim": "#d8dadc"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        "container-padding": "2rem",
        "gutter": "1rem",
        "message-gap": "1.5rem",
        "inner-padding": "1rem",
      },
      fontFamily: {
        "label-xs": ["Inter"],
        "mono-label": ["jetbrainsMono"],
        "label-md": ["Inter"],
        "body-base": ["Inter"],
        "body-sm": ["Inter"],
        "headline-sm": ["Inter"]
      },
      fontSize: {
        "label-xs": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        "mono-label": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "body-base": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "headline-sm": ["18px", { lineHeight: "28px", fontWeight: "600" }]
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'inherit',
            a: {
              color: '#2563eb',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            p: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            'ul, ol': {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            code: {
              color: '#0f172a',
              backgroundColor: '#f1f5f9',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '500',
              '&::before': {
                content: '"" !important',
              },
              '&::after': {
                content: '"" !important',
              },
            },
            pre: {
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
}
