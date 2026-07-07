import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client ships optional native bindings (used for local `file:` and
  // embedded replicas). Keep it external so the bundler doesn't try to trace
  // those into the serverless function — Next requires it from node_modules at
  // runtime, and remote Turso access is pure JS over HTTP.
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
