const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add reactStrictMode: true for better development experience
  reactStrictMode: true,
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add output: 'export' for static site generation (useful for Firebase hosting)
  // Note: Comment this out when developing locally with API routes or dynamic features
  // output: 'export'
};

module.exports = withNextIntl(nextConfig); 