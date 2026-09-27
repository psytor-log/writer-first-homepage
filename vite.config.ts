import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const siteUrl = (env.VITE_SITE_URL || "").replace(/\/$/, "");
  const naverVerification = env.VITE_NAVER_SITE_VERIFICATION || "";
  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react(), {
      name: "site-metadata",
      transformIndexHtml(html) {
        return html.replaceAll("%SITE_URL%", siteUrl).replaceAll("%NAVER_SITE_VERIFICATION%", naverVerification);
      },
    }],
  };
});
