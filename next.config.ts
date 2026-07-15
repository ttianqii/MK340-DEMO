import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Dockerfile copies .next/standalone into the runner image.
  output: "standalone",
  // mysql2 does dynamic requires (auth plugins, optional deps) that the
  // bundler can't trace statically — keep it external so it's resolved from
  // node_modules at runtime instead.
  serverExternalPackages: ["mysql2"],
};

export default nextConfig;
