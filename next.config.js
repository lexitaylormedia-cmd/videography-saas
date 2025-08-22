/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizeCss: false, // bypass LightningCSS native binding
  },
  optimizeFonts: false, // don't try to optimize fonts at build
};

module.exports = nextConfig;
