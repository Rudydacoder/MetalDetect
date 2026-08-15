import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet accesses `window` at module level — keep it out of the SSR bundle
  serverExternalPackages: ["leaflet"],
};

export default nextConfig;

