import { defineConfig } from "vite";
// Sabit dosya adları: yayınlanan sayfa her sürümde aynı yolları kullanır.
export default defineConfig({
  base: "./",
  build: { rollupOptions: { output: { entryFileNames: "assets/app.js", chunkFileNames: "assets/[name].js", assetFileNames: "assets/[name][extname]" } } },
});
