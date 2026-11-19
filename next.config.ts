import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

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
          // Next inlines its bootstrap scripts, so script-src keeps 'unsafe-inline' (a nonce would force
          // every page to render dynamically). The browser only talks to this origin: Supabase and
          // other providers are reached from the server. `next dev` needs eval for React refresh.
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
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
