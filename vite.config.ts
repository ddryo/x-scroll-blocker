import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import { resolve } from "path";

export default defineConfig({
  root: "src",
  publicDir: resolve(__dirname, "public"),
  plugins: [
    webExtension({
      manifest: "manifest.json",
    }),
  ],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
