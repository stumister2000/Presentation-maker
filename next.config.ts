import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  async redirects() {
    // sign-in, plans and settings were removed: send old links to the decks
    return ["/login", "/signup", "/reset", "/settings", "/auth/verify", "/privacy", "/terms"].map((source) => ({ source, destination: "/home", permanent: false }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};
export default config;
