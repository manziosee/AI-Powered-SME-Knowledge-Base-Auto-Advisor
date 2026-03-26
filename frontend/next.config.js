/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" is needed for self-hosted Docker only.
  // Vercel manages its own output — setting this breaks Vercel deployments.
  // Set NEXT_STANDALONE=true in Docker build env to enable it.
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
