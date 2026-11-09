import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { parseMediaOrigins } from "./src/lib/security-headers";

const mediaOrigins = parseMediaOrigins(process.env.MEDIA_IMAGE_ORIGINS);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Nonce CSP cannot be applied to a static shell. Next.js documents that
  // partial prerendering is incompatible with per-request nonces.
  cacheComponents: false,
  images: {
    remotePatterns: mediaOrigins.map((origin) => {
      const url = new URL(origin);
      return {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      };
    }),
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
