/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: false,
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'undici'],
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;