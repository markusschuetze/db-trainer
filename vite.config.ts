import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' => die gebaute App laeuft in jedem Unterverzeichnis
// (GitHub Pages, TH-Server, ILIAS-Lernmodul-ZIP, iFrame).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // SQLite (WebAssembly, eingebettet) ist bewusst ein eigener, grosser Chunk, der nur bei Bedarf laedt
  build: { chunkSizeWarningLimit: 1000 },
  test: { environment: 'node' },
});
