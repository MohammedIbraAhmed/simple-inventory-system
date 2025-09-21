/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-navigation-menu', 'lucide-react'],
  },

  // Compression and caching
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Bundle analyzer (conditionally enabled)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        )
      }
      return config
    },
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },

    // Headers for better caching
    headers: async () => [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ],
  }),

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Production bundle optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for common dependencies
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            // Common chunk for shared components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // UI components chunk
            ui: {
              name: 'ui',
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      }
    }

    return config
  },

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Faster builds in development
    webpack: (config) => {
      config.optimization = {
        ...config.optimization,
        providedExports: false,
        usedExports: false,
        sideEffects: false,
      }
      return config
    },
  }),
}

module.exports = nextConfig