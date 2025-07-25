import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
import { join } from 'path';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(import.meta.dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(import.meta.dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
