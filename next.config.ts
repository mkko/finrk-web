import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type checking done locally via tsc; the Next.js build type checker
    // on linux/amd64 misresolves Zustand store types.
    ignoreBuildErrors: true,
  },
  ...(isProd && {
    basePath: "/finrk/kaannostyo-demo",
    trailingSlash: true,
  }),
};

export default nextConfig;
