import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**/*.wasm",
      "./node_modules/@prisma/client/**/*.wasm",
    ],
  },
};

export default nextConfig;
