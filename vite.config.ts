import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api/fileio': {
        target: 'https://file.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fileio/, ''),
      },
      '/api': {
        target: 'https://api.getostrichai.com',
        changeOrigin: true,
        secure: false, // In case of self-signed certs or issues
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
