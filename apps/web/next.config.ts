import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@hookguard/types',
    '@hookguard/config',
    '@hookguard/blockchain',
  ],
  webpack: (config) => {
    // wagmi/RainbowKit pull @base-org/account → cdp-sdk, which optionally
    // imports x402 payment helpers we do not use.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/evm': false,
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    return config;
  },
};

export default nextConfig;
