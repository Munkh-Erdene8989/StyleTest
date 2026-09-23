import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "@google-cloud/tasks", "@google/genai"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
