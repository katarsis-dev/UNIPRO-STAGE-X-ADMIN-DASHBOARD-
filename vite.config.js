import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Kalau ada ini:
  base: "./", // atau base: '/app/'
  build: {
    rollupOptions: {
      input: {
        // Halaman Utama (Login)
        main: resolve(__dirname, "index.html"),

        // Halaman Dashboard (Sesuaikan nama filenya!)
        dashboard: resolve(__dirname, "dashboard.html"),
        bisagasih: resolve(__dirname, "bisagasih.html"),

        // Kalau ada halaman lain, tambah di sini...
        // profile: resolve(__dirname, 'profile.html'),
      },
    },
  },
});
