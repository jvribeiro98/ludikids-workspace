/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || isGithubPages,
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  output: isGithubPages ? 'export' : 'standalone',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

module.exports = withPWA(nextConfig);
