import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // FIX: Ensure this matches your GitHub Pages URL exactly
  site: 'https://nnigam96.github.io',
  
  // FIX: Remove 'base' unless you are deploying to a subfolder
  // base: '/', 

  output: 'static',
  
  // Note: Aliases are best managed in tsconfig.json, but keeping them here
  // as a fallback for Vite is fine if your build relies on it.
});