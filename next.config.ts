import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tetherto/wdk", "@tetherto/wdk-wallet-evm"],
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
