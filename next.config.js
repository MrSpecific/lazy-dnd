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
  // Aliases for Turbopack (Next 16 default) to avoid bundling server-only pino/thread-stream on the client.
  turbopack: {
    resolveAlias: {
      pino: path.resolve(__dirname, 'lib/shims/pino'),
      'thread-stream': path.resolve(__dirname, 'lib/shims/thread-stream'),
    },
  },
};

module.exports = nextConfig;
