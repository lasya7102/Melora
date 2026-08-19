import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },

  server: {
    port: 5173,
    host: "localhost",

    proxy: {
      "/api": {
        target: "https://melora1.onrender.com",
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
    host: "localhost",
  },
});