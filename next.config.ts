import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

// Serwist plugs into webpack, so production builds run with `next build --webpack`.
// Development uses Turbopack, which rejects any webpack config (even a disabled
// Serwist adds one), so the worker is wired only outside `next dev`.
export default process.env.NODE_ENV === "development"
  ? nextConfig
  : withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js" })(nextConfig);
