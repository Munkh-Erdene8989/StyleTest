import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "@google-cloud/tasks", "puppeteer-core", "@sparticuz/chromium-min", "sharp", "heic-convert", "heic-decode"],
  experimental: {
    serverActions: { bodySizeLimit: "100mb" },
    middlewareClientMaxBodySize: "100mb",
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
