import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@/*': ['./*'],
    }
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
