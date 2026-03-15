/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@apex/shared'],
  experimental: {
    typedRoutes: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
