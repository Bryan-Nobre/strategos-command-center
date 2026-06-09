import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  // Deploy alvo: Vercel (Nitro). Cloudflare desativado.
  cloudflare: false,
  plugins: [nitro({ preset: "vercel" })],
  tanstackStart: {
    // Usa o server entry padrão do TanStack Start (compatível com Nitro/Vercel)
  },
  vite: {
    server: {
      port: 3080,
    },
    resolve: {
      dedupe: ["@tanstack/react-query", "@tanstack/query-core"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;
            if (id.includes("recharts")) return "vendor-recharts";
            if (id.includes("exceljs")) return "vendor-exceljs";
            if (id.includes("react-dom")) return "vendor-react-dom";
          },
        },
      },
    },
  },
});
