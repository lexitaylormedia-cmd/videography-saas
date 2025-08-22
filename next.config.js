/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizeCss: false, // bypass lightningcss native binding
  },
  // If you later re-enable next/font and see warnings, you can also add:
  // optimizeFonts: false,
};

module.exports = nextConfig;
