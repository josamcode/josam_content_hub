import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function getBackendOrigin(env) {
  const raw = env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:5000";
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendOrigin = getBackendOrigin(env);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/uploads": {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
