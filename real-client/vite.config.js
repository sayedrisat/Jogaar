import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const proxy = { "/api": { target: process.env.JOGAAR_API_TARGET ?? "http://localhost:3000" } };

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
