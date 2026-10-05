import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Only this host: do not opt other subdomains into HTTPS or preload.
          { key: "Strict-Transport-Security", value: "max-age=2592000" },
          // Enforce safe directives now; audit script/connect restrictions before enforcement.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
          { key: "Content-Security-Policy-Report-Only", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
        ],
      },
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
