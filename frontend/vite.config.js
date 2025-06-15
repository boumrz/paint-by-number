import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  css: {
    modules: {
      generateScopedName: (name, filename) => {
        const componentName = filename.split('/').pop().split('.')[0];
        return `${componentName}_${name}`;
      }
    }
  }
});
