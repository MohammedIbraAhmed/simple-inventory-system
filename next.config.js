/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude scripts from TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations and Turbopack configuration
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-navigation-menu', 'lucide-react'],
    // Turbopack configuration (for npm run dev --turbo)
    turbo: {
      resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
      resolveAlias: {
        // Add any needed aliases here in the future
      }
    }
  },

  // Compression and caching
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

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

  // Webpack optimizations (only when not using Turbopack)
  ...(!process.env.npm_lifecycle_script?.includes('--turbo') && {
    webpack: (config, { isServer, dev }) => {
      // Bundle analyzer (conditionally enabled)
      if (process.env.ANALYZE === 'true' && !isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        )
      }

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
      } else {
        // Development optimizations
        config.optimization = {
          ...config.optimization,
          providedExports: false,
          usedExports: false,
          sideEffects: false,
        }
      }

      return config
    },
  }),
}

module.exports = nextConfig