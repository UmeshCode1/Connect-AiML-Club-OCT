import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@connect/ui', '@connect/types', '@connect/config'],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
