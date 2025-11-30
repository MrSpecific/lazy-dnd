/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    outputFileTracingExcludes: {
      '**': [
        './node_modules/thread-stream/test/**', // Exclude thread-stream test files
      ],
    },
    serverComponentsExternalPackages: ['thread-stream'],
  },
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
  // experimental: {
  //   turbo: {
  //     resolveAlias: {
  //       pino: './lib/shims/pino',
  //     },
  //   },
  // },
  // webpack: (config) => {
  //   config.resolve = config.resolve || {}
  //   config.resolve.alias = {
  //     ...(config.resolve.alias || {}),
  //     pino: require('path').resolve(__dirname, 'lib/shims/pino'),
  //   }
  //   return config
  // },
};

module.exports = nextConfig;
