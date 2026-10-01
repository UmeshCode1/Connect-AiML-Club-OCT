import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@connect/ui', '@connect/types', '@connect/config'],
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
