/** @type {import('next').NextConfig} */
const nextConfig = {
  // Helpful while we stabilize the project. Remove later if you want stricter builds.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
