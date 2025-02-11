import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts"; 

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "simple-stock",
      fileName: (format) => `simple-stock.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  plugins: [dts()],
});
