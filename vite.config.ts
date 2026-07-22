import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React runtime — cached aggressively
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-core';
          // Routing
          if (id.includes('node_modules/wouter')) return 'react-core';
          // Data fetching
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query')) return 'query';
          // UI primitives — large, stable, cache-friendly
          if (id.includes('@radix-ui')) return 'radix';
          // Icons — tree-shakeable but still sizeable
          if (id.includes('lucide-react')) return 'icons';
          // Charts — only used on a few pages
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          // Everything else in node_modules goes to a general vendor chunk
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
