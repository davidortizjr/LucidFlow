import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', 'html[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                "outline": "rgb(117 118 132 / <alpha-value>)",
                "on-secondary-container": "rgb(82 103 114 / <alpha-value>)",
                "on-secondary": "#ffffff",
                "primary-container": "rgb(124 58 237 / <alpha-value>)",
                "surface-container-low": "rgb(243 244 245 / <alpha-value>)",
                "on-secondary-fixed": "rgb(7 30 39 / <alpha-value>)",
                "tertiary": "rgb(0 74 84 / <alpha-value>)",
                "on-surface": "var(--text-primary)",
                "tertiary-fixed": "rgb(158 239 255 / <alpha-value>)",
                "on-error": "#ffffff",
                "background": "var(--bg-primary)",
                "on-primary-container": "rgb(243 232 255 / <alpha-value>)",
                "surface-variant": "rgb(225 227 228 / <alpha-value>)",
                "surface-bright": "rgb(248 249 250 / <alpha-value>)",
                "on-tertiary-fixed": "rgb(0 31 36 / <alpha-value>)",
                "on-tertiary": "#ffffff",
                "on-background": "var(--text-primary)",
                "inverse-primary": "rgb(233 213 255 / <alpha-value>)",
                "on-tertiary-container": "rgb(100 227 249 / <alpha-value>)",
                "tertiary-container": "rgb(0 100 113 / <alpha-value>)",
                "on-tertiary-fixed-variant": "rgb(0 78 89 / <alpha-value>)",
                "on-secondary-fixed-variant": "rgb(53 74 83 / <alpha-value>)",
                "primary-fixed": "rgb(243 232 255 / <alpha-value>)",
                "surface-container-lowest": "var(--surface-1)",
                "surface-dim": "rgb(217 218 219 / <alpha-value>)",
                "on-primary-fixed": "rgb(59 7 100 / <alpha-value>)",
                "on-surface-variant": "var(--text-secondary)",
                "secondary-fixed": "rgb(207 230 242 / <alpha-value>)",
                "primary-fixed-dim": "rgb(233 213 255 / <alpha-value>)",
                "secondary-container": "rgb(207 230 242 / <alpha-value>)",
                "on-primary-fixed-variant": "rgb(91 33 182 / <alpha-value>)",
                "primary": "rgb(109 40 217 / <alpha-value>)",
                "inverse-on-surface": "rgb(240 241 242 / <alpha-value>)",
                "surface": "var(--bg-primary)",
                "secondary-fixed-dim": "rgb(180 202 214 / <alpha-value>)",
                "error-container": "rgb(255 218 214 / <alpha-value>)",
                "tertiary-fixed-dim": "rgb(85 215 237 / <alpha-value>)",
                "error": "rgb(186 26 26 / <alpha-value>)",
                "surface-container-highest": "var(--bg-tertiary)",
                "on-primary": "#ffffff",
                "surface-tint": "rgb(109 40 217 / <alpha-value>)",
                "surface-container-high": "rgb(231 232 233 / <alpha-value>)",
                "outline-variant": "rgb(197 197 212 / <alpha-value>)",
                "inverse-surface": "rgb(46 49 50 / <alpha-value>)",
                "surface-container": "var(--surface-2)",
                "on-error-container": "rgb(147 0 10 / <alpha-value>)",
                "secondary": "rgb(76 97 108 / <alpha-value>)"
            },
            fontFamily: {
                "manrope": ["Manrope"],
                "body": ["Inter"],
                "label": ["Inter"]
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
        },
    },
    plugins: [],
}

export default config
