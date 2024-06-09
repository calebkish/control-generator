/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
    colors: {
      'violet': {
        '900': '#270057',
        '800': '#42008a',
        '750': '#5000a4',
        '700': '#5f00c0',
        '650': '#6e00dc',
        '600': '#7d00fa',
        '500': '#944aff',
        '400': '#a974ff',
        '300': '#bf98ff',
        '200': '#d5baff',
        '100': '#ecdcff',
        '50': '#f7edff',
        '20': '#fef7ff',
        '10': '#fffbff',
      }
    }
  },
  plugins: [],
}

