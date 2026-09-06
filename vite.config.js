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
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
