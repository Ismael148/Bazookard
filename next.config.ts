import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // build autonome : un seul dossier à déployer (node server.js)
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
