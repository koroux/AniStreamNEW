/** @type {import('next').NextConfig} */
const nextConfig = {
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