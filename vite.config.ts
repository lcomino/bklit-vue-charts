import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(rootDir, "src/index.ts"),
      name: "BklitVueCharts",
      formats: ["es", "umd"],
      fileName: "bklit-vue-charts",
      cssFileName: "style",
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: { vue: "Vue" },
      },
    },
  },
});
