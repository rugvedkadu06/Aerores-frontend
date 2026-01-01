/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                bg: {
                    DEFAULT: '#0B0C10',
                    void: '#000000',
                    panel: '#12141C',
                },
                accent: {
                    DEFAULT: '#66FCF1', // Cyan/Teal
                    dim: 'rgba(102, 252, 241, 0.1)',
                    glow: 'rgba(102, 252, 241, 0.5)',
                },
                status: {
                    ok: '#45A29E',
                    warning: '#F7C5ad', // Warm amber-ish
                    critical: '#C5C6C7', // Reduced white for subtle, or actual red
                    danger: '#ef4444',
                    success: '#10b981',
                },
                surface: {
                    DEFAULT: 'rgba(255, 255, 255, 0.03)',
                    border: 'rgba(255, 255, 255, 0.08)',
                }
            },
            boxShadow: {
                'glow': '0 0 10px rgba(102, 252, 241, 0.3)',
                'glow-sm': '0 0 5px rgba(102, 252, 241, 0.2)',
                'crisis': '0 0 20px rgba(239, 68, 68, 0.4)',
                'crisis-lg': '0 0 50px rgba(239, 68, 68, 0.6)',
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
