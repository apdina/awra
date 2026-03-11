/** @type {import('next').NextConfig} */
const nextConfig = {
  // Path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './',
    };
    return config;
  },
  // Allow development server to be accessed from different IPs
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Allow cross-origin requests in development
  allowedDevOrigins: ['192.168.1.7', 'localhost', '127.0.0.1'],
  // Turbopack config to silence warning
  turbopack: {},
};

module.exports = nextConfig;
