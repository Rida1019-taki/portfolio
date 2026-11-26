import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/index.html",
      },
      {
        source: "/site",
        destination: "/site/index.html",
      },
    ];
  },
};

export default nextConfig;
