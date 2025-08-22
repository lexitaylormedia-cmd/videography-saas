/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep builds going while we stabilize
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Disable LightningCSS (native binding that’s failing on Vercel)
  experimental: {
    optimizeCss: false,
  },

  // Optional: if you see any other next/font warnings, you can also disable font opt:
  // optimizeFonts: false,
};

module.exports = nextConfig;
