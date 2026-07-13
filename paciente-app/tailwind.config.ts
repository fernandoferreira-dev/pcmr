// tailwind.config.ts
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                'primary-outline': 'var(--color-primary-outline)',
                text: 'var(--color-text)',
                muted: 'var(--color-muted)',
                background: 'var(--color-background)',
                'surface-footer': 'var(--color-surface-footer)',
            },
            fontFamily: {
                sans: ['var(--font-sans)'],
            },
        },
    },
};