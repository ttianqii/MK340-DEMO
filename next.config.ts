import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server (.next/standalone) with only the traced
  // node_modules — including the native better-sqlite3 binary — so the Docker
  // image stays small and needs no `npm install` at runtime.
  output: "standalone",
};

export default nextConfig;
