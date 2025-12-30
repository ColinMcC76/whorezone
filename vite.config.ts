import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the MCWhoreZone project.
// The `base` field controls the root path when the site is served from a subdirectory,
// such as when deploying to GitHub Pages. You can update this to match your repository
// name (e.g. '/mcwhorezone/') or keep it as '/' when serving from a custom domain.
export default defineConfig({
  plugins: [react()],
  base: '/',
});