/** @type {import('next').NextConfig} */
module.exports = {
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
