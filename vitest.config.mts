import { fileURLToPath } from "node:url";
import process from "node:process";
import { defineConfig } from "vitest/config";

// t3-env validates process.env at import time, so load .env before tests run
try {
  process.loadEnvFile();
}
catch {
  // .env is optional (e.g. CI injects variables directly)
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
