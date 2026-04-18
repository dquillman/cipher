/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1', // Indigo-500
                    600: '#4f46e5', // Indigo-600 (Primary)
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                accent: {
                    400: '#fbbf24',
                    500: '#f59e0b', // Amber-500 (Secondary/Energy)
                    600: '#d97706',
                },
                success: {
                    500: '#10b981', // Emerald-500
                }
            },
            fontFamily: {
                sans: ['General Sans', 'sans-serif'],
                display: ['Satoshi', 'sans-serif'],
            }
        },
    },
    plugins: [],
}

