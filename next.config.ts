import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.EXPORT_MOBILE === "true" ? "export" : undefined,
  images: {
    unoptimized: process.env.EXPORT_MOBILE === "true" ? true : undefined,
  },
};

export default nextConfig;
