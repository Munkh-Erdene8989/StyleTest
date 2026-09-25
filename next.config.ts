import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "@google-cloud/tasks"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
