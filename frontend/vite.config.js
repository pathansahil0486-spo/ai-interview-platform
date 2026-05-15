import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteMorganPlugin from "./vite-plugin-morgan.js";

// Silence the "/*! 🌼 daisyUI x.x.x */" console banner
const silenceDaisyUI = {
  name: "silence-daisyui",
  configureServer(server) {
    const orig = console.log.bind(console);
    console.log = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("daisyUI")) return;
      orig(...args);
    };
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteMorganPlugin(),
    silenceDaisyUI,
  ],

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});