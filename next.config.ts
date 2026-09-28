import type { NextConfig } from "next";

const rawBackendUrl = process.env.BACKEND_URL || "http://localhost:5000";
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: [
    "192.168.1.108",
    "192.168.1.108:3000",
    "192.168.1.108:3001",
    "localhost:3000",
    "localhost:3001",
  ],
  images: {
    dangerouslyAllowLocalIP: true,
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: "/api/v2/:path*",
        destination: `${BACKEND_URL}/api/v2/:path*`,
      },
      {
        source: "/api/:path((?!auth).*)",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
