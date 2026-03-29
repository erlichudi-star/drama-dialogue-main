import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// HMR מופעל כברירת מחדל. אם שינויים בקבצים לא מרעננים את הדפדפן (Docker/WSL/כונן רשת),
// הרץ: npm run dev:poll   או   VITE_USE_POLLING=1 npm run dev
const usePolling = process.env.VITE_USE_POLLING === "1";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: false,
    // רענון אוטומטי כששומרים קבצים — ודא שה-watcher תופס את כל השינויים
    watch: usePolling
      ? { usePolling: true, interval: 1000 }
      : undefined,
    hmr: {
      // אם עובדים דרך proxy/CDN, אפשר לפרוס host/port כאן
      overlay: true,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
