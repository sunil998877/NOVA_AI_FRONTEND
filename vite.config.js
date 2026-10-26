import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import dns from "dns";

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const reactAppEnv = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("REACT_APP_") || key.startsWith("VITE_"))
      .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  );

  const rawTarget =
    env.VITE_BACKEND_URL ||
    env.BACKEND_PROXY_TARGET ||
    env.REACT_APP_API_URL ||
    "http://127.0.0.1:3001";
  const proxyTarget = rawTarget.replace("localhost", "127.0.0.1").replace(/\/$/, "");

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
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, req, res) => {
              if (res && !res.headersSent && typeof res.writeHead === "function") {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    error: "Backend proxy connection failed",
                    message: err?.message,
                    target: proxyTarget,
                  })
                );
              }
            });
          },
        },
        "/socket.io": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on("error", () => {
            });
          },
        },
      },
    },
  };
});
