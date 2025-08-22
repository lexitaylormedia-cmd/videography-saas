/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    // Turn off LightningCSS minifier to avoid native binding issues on some hosts
    optimizeCss: false,
  },
  // optional: if you use next/font with remote fonts and see warnings, you can also disable font optimization
  // optimizeFonts: false,
};

module.exports = nextConfig;
