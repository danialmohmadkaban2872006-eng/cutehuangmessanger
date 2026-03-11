// © Danial Mohmad — All Rights Reserved
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// After migration to Supabase, there is no local backend server.
// The app talks directly to Supabase over HTTPS — no proxy needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
