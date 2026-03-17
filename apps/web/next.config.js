/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@apex/shared'],
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v2.exercisedb.io',
      },
      {
        protocol: 'https',
        hostname: '**.exercisedb.io',
      },
      {
        protocol: 'https',
        hostname: 'exercisedb.p.rapidapi.com',
      },
    ],
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
