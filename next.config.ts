import type { NextConfig } from "next";
import withPWA from "next-pwa";
import { runtimeCaching } from "./src/lib/pwa/cache-policy";

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

export default withPWA({
  dest: "public",
  disable: false,
  register: true,
  skipWaiting: true,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  runtimeCaching,
})(nextConfig);
