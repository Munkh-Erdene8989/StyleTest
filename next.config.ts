import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/tasks",
    "puppeteer-core",
    "@sparticuz/chromium-min",
    "sharp",
    "heic-convert",
    "heic-decode",
    "@ffmpeg-installer/ffmpeg",
  ],
  outputFileTracingIncludes: {
    "/api/tap/media": ["./node_modules/@ffmpeg-installer/*/**"],
    "/api/tap/[id]/replace": ["./node_modules/@ffmpeg-installer/*/**"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "100mb" },
    middlewareClientMaxBodySize: "100mb",
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
