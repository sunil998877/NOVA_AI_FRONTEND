import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const reactAppEnv = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("REACT_APP_"))
      .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  );

  return {
    plugins: [react()],
    define: reactAppEnv,
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: (
            env.VITE_BACKEND_URL ||
            env.BACKEND_PROXY_TARGET ||
            env.REACT_APP_API_URL ||
            "http://localhost:3001"
          ).replace(/\/$/, ""),
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
