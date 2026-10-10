/* ColdGuard Tailwind theme map.
 * CSS custom properties in css/styles.css remain the token source of truth.
 * The standalone CDN shell maps the same variables in index.html.
 */
module.exports = {
  content: ["./index.html", "./design-system.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "var(--cg-slate-900)",
          blue: "rgb(var(--cg-blue-600-rgb) / <alpha-value>)",
          safe: "rgb(var(--cg-success-solid-rgb) / <alpha-value>)",
          warning: "rgb(var(--cg-warning-solid-rgb) / <alpha-value>)",
          critical: "rgb(var(--cg-danger-solid-rgb) / <alpha-value>)",
          secondary: "var(--cg-slate-500)"
        },
        blue: {
          50:"rgb(var(--cg-blue-50-rgb) / <alpha-value>)",100:"rgb(var(--cg-blue-100-rgb) / <alpha-value>)",200:"rgb(var(--cg-blue-200-rgb) / <alpha-value>)",
          300:"rgb(var(--cg-blue-300-rgb) / <alpha-value>)",400:"rgb(var(--cg-blue-400-rgb) / <alpha-value>)",500:"rgb(var(--cg-blue-500-rgb) / <alpha-value>)",
          600:"rgb(var(--cg-blue-600-rgb) / <alpha-value>)",700:"rgb(var(--cg-blue-700-rgb) / <alpha-value>)",800:"rgb(var(--cg-blue-800-rgb) / <alpha-value>)",900:"rgb(var(--cg-blue-900-rgb) / <alpha-value>)"
        },
        indigo: {
          50:"rgb(var(--cg-indigo-50-rgb) / <alpha-value>)",100:"rgb(var(--cg-indigo-100-rgb) / <alpha-value>)",200:"rgb(var(--cg-indigo-200-rgb) / <alpha-value>)",
          300:"rgb(var(--cg-indigo-300-rgb) / <alpha-value>)",400:"rgb(var(--cg-indigo-400-rgb) / <alpha-value>)",500:"rgb(var(--cg-indigo-500-rgb) / <alpha-value>)",
          600:"rgb(var(--cg-indigo-600-rgb) / <alpha-value>)",700:"rgb(var(--cg-indigo-700-rgb) / <alpha-value>)",800:"rgb(var(--cg-indigo-800-rgb) / <alpha-value>)",900:"rgb(var(--cg-indigo-900-rgb) / <alpha-value>)"
        },
        success: { DEFAULT:"rgb(var(--cg-success-solid-rgb) / <alpha-value>)", bg:"rgb(var(--cg-success-bg-rgb) / <alpha-value>)", border:"rgb(var(--cg-success-border-rgb) / <alpha-value>)", text:"rgb(var(--cg-success-text-rgb) / <alpha-value>)" },
        warning: { DEFAULT:"rgb(var(--cg-warning-solid-rgb) / <alpha-value>)", bg:"rgb(var(--cg-warning-bg-rgb) / <alpha-value>)", border:"rgb(var(--cg-warning-border-rgb) / <alpha-value>)", text:"rgb(var(--cg-warning-text-rgb) / <alpha-value>)" },
        danger: { DEFAULT:"rgb(var(--cg-danger-solid-rgb) / <alpha-value>)", bg:"rgb(var(--cg-danger-bg-rgb) / <alpha-value>)", border:"rgb(var(--cg-danger-border-rgb) / <alpha-value>)", text:"rgb(var(--cg-danger-text-rgb) / <alpha-value>)" },
        info: { DEFAULT:"rgb(var(--cg-info-solid-rgb) / <alpha-value>)", bg:"rgb(var(--cg-info-bg-rgb) / <alpha-value>)", border:"rgb(var(--cg-info-border-rgb) / <alpha-value>)", text:"rgb(var(--cg-info-text-rgb) / <alpha-value>)" },
        surface: { DEFAULT:"var(--cg-surface)", raised:"var(--cg-surface-raised)", muted:"var(--cg-surface-muted)" },
        ink: { DEFAULT:"var(--cg-text)", secondary:"var(--cg-text-secondary)", muted:"var(--cg-text-muted)" },
        slate: {
          50:"rgb(var(--cg-slate-50-rgb) / <alpha-value>)",100:"rgb(var(--cg-slate-100-rgb) / <alpha-value>)",
          200:"rgb(var(--cg-slate-200-rgb) / <alpha-value>)",300:"rgb(var(--cg-slate-300-rgb) / <alpha-value>)",
          400:"rgb(var(--cg-slate-400-rgb) / <alpha-value>)",500:"rgb(var(--cg-slate-500-rgb) / <alpha-value>)",
          600:"rgb(var(--cg-slate-600-rgb) / <alpha-value>)",700:"rgb(var(--cg-slate-700-rgb) / <alpha-value>)",
          800:"rgb(var(--cg-slate-800-rgb) / <alpha-value>)",900:"rgb(var(--cg-slate-900-rgb) / <alpha-value>)"
        }
      },
      borderRadius: {
        DEFAULT:"var(--cg-radius-sm)", sm:"var(--cg-radius-sm)", md:"var(--cg-radius-sm)",
        lg:"var(--cg-radius-sm)", xl:"var(--cg-radius-md)", "2xl":"var(--cg-radius-lg)",
        "3xl":"var(--cg-radius-xl)", pill:"var(--cg-radius-pill)"
      },
      boxShadow: {
        sm:"var(--cg-shadow-sm)", md:"var(--cg-shadow-md)", lg:"var(--cg-shadow-lg)",
        cgSm:"var(--cg-shadow-sm)", cgMd:"var(--cg-shadow-md)", cgLg:"var(--cg-shadow-lg)",
        "glow-blue":"var(--cg-shadow-glow-blue)", "glow-red":"var(--cg-shadow-glow-red)"
      },
      spacing: {
        cg1:"var(--cg-space-1)", cg2:"var(--cg-space-2)", cg3:"var(--cg-space-3)",
        cg4:"var(--cg-space-4)", cg5:"var(--cg-space-5)", cg6:"var(--cg-space-6)", cg8:"var(--cg-space-8)"
      },
      fontSize: {
        xs:"var(--cg-text-xs)", sm:"var(--cg-text-sm)", base:"var(--cg-text-base)",
        lg:"var(--cg-text-lg)", xl:"var(--cg-text-xl)", "2xl":"var(--cg-text-2xl)",
        label:["var(--cg-text-xs)",{lineHeight:"1.4"}],
        body:["var(--cg-text-sm)",{lineHeight:"1.5"}],
        telemetry:["var(--cg-text-base)",{lineHeight:"1.4"}]
      },
      fontFamily: {
        sans:["Inter","sans-serif"],
        mono:["JetBrains Mono","monospace"]
      }
    }
  },
  plugins: []
};
