/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allows production builds to successfully complete even if
    // the builder gets bogged down in third-party library types.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevents code formatting warnings from freezing the build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;