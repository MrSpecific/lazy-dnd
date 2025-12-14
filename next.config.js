const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/00000000000000000000000000000000',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**/*',
      },
    ],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        'pino': path.resolve(__dirname, 'lib/shims/pino.js'),
        'thread-stream': path.resolve(__dirname, 'lib/shims/thread-stream.js'),
      },
    },
  },
};

module.exports = nextConfig;
