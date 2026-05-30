import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.4'],
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
