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
  serverExternalPackages: [
    'pino',
    'thread-stream',
    // Add specific transports if you are using them, e.g.:
    // 'pino-pretty',
    // '@logtail/pino',
  ],
};

module.exports = nextConfig;
