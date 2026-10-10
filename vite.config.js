import { defineConfig } from 'vite';

export default defineConfig({
  // Path relatif supaya hasil build bisa di-host di subfolder (itch.io, GitHub Pages, dll.)
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Pisahkan Phaser ke chunk tersendiri agar kode game kecil & cache-friendly
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
    // Phaser memang besar (~1MB), naikkan batas peringatan
    chunkSizeWarningLimit: 1500,
  },
});