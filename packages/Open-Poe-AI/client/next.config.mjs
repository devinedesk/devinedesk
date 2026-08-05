/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ai-agent'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.Local API.ai',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
