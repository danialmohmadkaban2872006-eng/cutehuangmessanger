<<<<<<< HEAD
// © Danial Mohmad — All Rights Reserved
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// After migration to Supabase, there is no local backend server.
// The app talks directly to Supabase over HTTPS — no proxy needed.
=======
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
<<<<<<< HEAD
=======
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
