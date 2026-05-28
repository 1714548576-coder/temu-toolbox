import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/temu-toolbox",
  images: { unoptimized: true },
};

export default nextConfig;
