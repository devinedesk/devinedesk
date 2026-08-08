const sharedConfig = require('../../tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedConfig],
  content: ['./src/**/*.{js,jsx,ts,tsx}', '../../components/**/*.{js,jsx,ts,tsx}'],
};
