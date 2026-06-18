import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.4'],
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    // In local dev, the API lives in a separate Wrangler worker (see `api/`).
    // Proxy /api/* to it so relative fetch('/api/...') calls work the same
    // as they do in production, where Cloudflare routes /api/* to that worker.
    return [
      { source: '/api/:path*', destination: 'http://127.0.0.1:8787/api/:path*' },
    ];
  },
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        buffer: 'node:buffer',
        async_hooks: 'node:async_hooks',
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      buffer: 'node:buffer',
      async_hooks: 'node:async_hooks',
    },
  },
};

export default nextConfig;
